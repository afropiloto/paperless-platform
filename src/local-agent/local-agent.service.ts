import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentRole, MemoryKind } from './local-agent.constants';
import { RoleRouterService } from './roles/role-router.service';
import { VertexAiService } from './gcp/vertex-ai.service';
import { MemoryService } from './memory/memory.service';
import { AgentSessionService } from './sessions/agent-session.service';
import { AgentTaskService } from './tasks/agent-task.service';
import { ToolRegistry } from './tools/tool.registry';
import type { LocalAgentConfig } from './config/local-agent.config';
import type { AgentTurnResult, ChatMessage } from './local-agent.types';

export interface ChatInput {
  message: string;
  role?: AgentRole | string;
  sessionId?: string;
  accountId?: string;
  userId?: string;
  toolCalls?: Array<{ name: string; args?: Record<string, unknown> }>;
}

@Injectable()
export class LocalAgentService {
  private readonly logger = new Logger(LocalAgentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly roleRouter: RoleRouterService,
    private readonly vertexAi: VertexAiService,
    private readonly memoryService: MemoryService,
    private readonly sessionService: AgentSessionService,
    private readonly taskService: AgentTaskService,
    private readonly toolRegistry: ToolRegistry,
  ) {}

  private get config(): LocalAgentConfig {
    return this.configService.get<LocalAgentConfig>('localAgent')!;
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      provider: this.config.provider,
      projectId: this.config.projectId || null,
      location: this.config.location,
      chatModel: this.config.chatModel,
      embeddingModel: this.config.embeddingModel,
      roles: this.roleRouter.listRoles().map((r) => ({
        role: r.role,
        name: r.name,
        tools: r.defaultTools,
      })),
      tools: this.toolRegistry.list().map((t) => ({
        name: t.name,
        description: t.description,
        roles: t.roles || ['*'],
      })),
      allowLocalBuilds: this.config.allowLocalBuilds,
    };
  }

  async chat(input: ChatInput): Promise<AgentTurnResult> {
    if (!this.config.enabled) {
      throw new Error('Local agent is disabled (LOCAL_AGENT_ENABLED=false)');
    }

    const persona = this.roleRouter.resolve(input.role, input.message);
    const session = await this.sessionService.getOrCreate({
      sessionId: input.sessionId,
      accountId: input.accountId,
      userId: input.userId,
      role: persona.role,
    });

    const toolContext = {
      accountId: input.accountId,
      userId: input.userId,
      sessionId: session.sessionId,
      role: persona.role,
    };

    const memories = await this.memoryService.recall({
      query: input.message,
      accountId: input.accountId,
      userId: input.userId,
      topK: this.config.memoryTopK,
      kinds: [
        MemoryKind.EPISODIC,
        MemoryKind.SEMANTIC,
        MemoryKind.PROCEDURAL,
        MemoryKind.PREFERENCE,
      ],
    });

    const recent = await this.sessionService.getRecentMessages(session.sessionId, 12);
    const tools = this.toolRegistry.list(persona.role);

    const systemInstruction = [
      persona.systemPrompt,
      '',
      'Relevant memories:',
      this.memoryService.formatForPrompt(memories),
      '',
      `Tools you may request via explicit JSON actions: ${tools.map((t) => t.name).join(', ')}.`,
      'If the user asks to remember something, create tasks, draft marketing, or run builds, prefer using tools.',
    ].join('\n');

    const messages: ChatMessage[] = [
      ...recent,
      { role: 'user', content: input.message },
    ];

    const generation = await this.vertexAi.generate(messages, {
      systemInstruction,
      toolsHint: tools.map((t) => t.name),
    });

    const explicitToolCalls = input.toolCalls?.length
      ? input.toolCalls
      : this.extractToolCalls(input.message, persona.role);

    const toolCallResults: Array<{ name: string; result: unknown }> = [];
    const taskIds: string[] = [];

    for (const call of explicitToolCalls) {
      try {
        const result = await this.toolRegistry.execute(
          call.name,
          call.args || {},
          toolContext,
        );
        toolCallResults.push({ name: call.name, result });
        if (
          result &&
          typeof result === 'object' &&
          'id' in (result as object) &&
          call.name.includes('task')
        ) {
          taskIds.push(String((result as { id: string }).id));
        }
        if (
          result &&
          typeof result === 'object' &&
          'taskId' in (result as object)
        ) {
          taskIds.push(String((result as { taskId: string }).taskId));
        }
      } catch (error) {
        toolCallResults.push({
          name: call.name,
          result: { error: (error as Error).message },
        });
      }
    }

    let reply = generation.text;
    if (toolCallResults.length) {
      reply +=
        '\n\n---\nTool results:\n' +
        toolCallResults
          .map((t) => `- ${t.name}: ${JSON.stringify(t.result)}`)
          .join('\n');
    }

    await this.sessionService.appendMessages(session.sessionId, [
      { role: 'user', content: input.message },
      { role: 'assistant', content: reply },
    ]);

    await this.memoryService.store({
      kind: MemoryKind.WORKING,
      content: `User: ${input.message}\nAssistant(${persona.role}): ${reply.slice(0, 500)}`,
      sessionId: session.sessionId,
      accountId: input.accountId,
      userId: input.userId,
      role: persona.role,
      tags: ['working', 'turn'],
      importance: 0.3,
    });

    this.logger.log(
      `Agent turn session=${session.sessionId} role=${persona.role} tools=${toolCallResults.length}`,
    );

    return {
      sessionId: session.sessionId,
      role: persona.role,
      reply,
      model: generation.model,
      provider: generation.provider,
      memoriesUsed: memories.length,
      toolCalls: toolCallResults,
      taskIds,
    };
  }

  /**
   * Lightweight intent → tool mapping so mock/local modes still automate work
   * without requiring the model to emit structured tool JSON.
   */
  private extractToolCalls(
    message: string,
    role: AgentRole,
  ): Array<{ name: string; args?: Record<string, unknown> }> {
    const lower = message.toLowerCase();
    const calls: Array<{ name: string; args?: Record<string, unknown> }> = [];

    if (/\b(remember|memorize|note that|save preference)\b/.test(lower)) {
      const content = message.replace(/^(please\s+)?(remember|memorize|note that|save preference)\s*/i, '').trim();
      if (/\bpreference\b/.test(lower) || role === AgentRole.TWIN) {
        calls.push({ name: 'memory_upsert_preference', args: { content: content || message } });
      } else {
        calls.push({
          name: 'memory_store',
          args: { kind: MemoryKind.SEMANTIC, content: content || message, importance: 0.7 },
        });
      }
    }

    if (/\b(create task|add task|todo:|track this)\b/.test(lower)) {
      calls.push({
        name: 'create_task',
        args: {
          title: message.slice(0, 120),
          description: message,
          type: /\bbuild\b/.test(lower) ? 'build' : 'generic',
        },
      });
    }

    if (/\b(run build|pnpm build|kick off build|start build)\b/.test(lower)) {
      calls.push({ name: 'run_build', args: { script: 'build', sync: false } });
    }

    if (/\b(draft|campaign|linkedin post|positioning|gtm)\b/.test(lower) && (role === AgentRole.CMO || role === AgentRole.TWIN || role === AgentRole.AUTO || role === AgentRole.PA)) {
      if (role === AgentRole.CMO || /\b(draft|campaign|linkedin|gtm|positioning)\b/.test(lower)) {
        calls.push({
          name: 'draft_marketing',
          args: { brief: message, channel: lower.includes('linkedin') ? 'linkedin' : 'web' },
        });
      }
    }

    if (/\b(status|health|provider)\b/.test(lower) && /\b(agent|platform|vertex|gcp)\b/.test(lower)) {
      calls.push({ name: 'platform_status', args: {} });
    }

    return calls;
  }
}
