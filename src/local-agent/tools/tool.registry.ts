import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { MemoryService } from '../memory/memory.service';
import { AgentTaskService } from '../tasks/agent-task.service';
import {
  AgentRole,
  AgentTaskStatus,
  AgentTaskType,
  MemoryKind,
} from '../local-agent.constants';
import type { ToolContext, ToolDefinition } from '../local-agent.types';
import type { LocalAgentConfig } from '../config/local-agent.config';
import { entityId } from '../local-agent.utils';

const execFileAsync = promisify(execFile);

@Injectable()
export class ToolRegistry implements OnModuleInit {
  private readonly logger = new Logger(ToolRegistry.name);
  private readonly tools = new Map<string, ToolDefinition>();

  constructor(
    private readonly memoryService: MemoryService,
    private readonly taskService: AgentTaskService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    for (const tool of this.buildTools()) {
      this.tools.set(tool.name, tool);
    }
    this.logger.log(`Registered ${this.tools.size} local-agent tools`);
  }

  list(role?: string): ToolDefinition[] {
    const all = Array.from(this.tools.values());
    if (!role) return all;
    return all.filter((t) => !t.roles?.length || t.roles.includes(role));
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  async execute(
    name: string,
    args: Record<string, unknown>,
    context: ToolContext,
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    if (tool.roles?.length && !tool.roles.includes(context.role)) {
      throw new Error(`Tool ${name} is not available for role ${context.role}`);
    }
    return tool.execute(args, context);
  }

  private get config(): LocalAgentConfig {
    return this.configService.get<LocalAgentConfig>('localAgent')!;
  }

  private buildTools(): ToolDefinition[] {
    return [
      {
        name: 'memory_store',
        description: 'Persist a memory (episodic, semantic, procedural, preference, working).',
        parameters: {
          type: 'object',
          properties: {
            kind: { type: 'string' },
            content: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            importance: { type: 'number' },
          },
          required: ['kind', 'content'],
        },
        execute: async (args, ctx) => {
          const memory = await this.memoryService.store({
            kind: (args.kind as MemoryKind) || MemoryKind.SEMANTIC,
            content: String(args.content),
            tags: (args.tags as string[]) || [],
            importance: typeof args.importance === 'number' ? args.importance : 0.6,
            accountId: ctx.accountId,
            userId: ctx.userId,
            sessionId: ctx.sessionId,
            role: ctx.role as AgentRole,
          });
          return { id: entityId(memory), kind: memory.kind };
        },
      },
      {
        name: 'memory_recall',
        description: 'Recall top memories relevant to a query.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            topK: { type: 'number' },
          },
          required: ['query'],
        },
        execute: async (args, ctx) => {
          const results = await this.memoryService.recall({
            query: String(args.query),
            topK: typeof args.topK === 'number' ? args.topK : undefined,
            accountId: ctx.accountId,
            userId: ctx.userId,
          });
          return results.map((r) => ({
            id: entityId(r.memory),
            kind: r.memory.kind,
            content: r.memory.content,
            score: r.score,
          }));
        },
      },
      {
        name: 'memory_search',
        description: 'Alias of memory_recall for semantic + lexical search.',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' }, topK: { type: 'number' } },
          required: ['query'],
        },
        execute: async (args, ctx) =>
          this.execute('memory_recall', args, ctx),
      },
      {
        name: 'memory_upsert_preference',
        description: 'Upsert a durable user preference for the digital twin.',
        roles: [AgentRole.TWIN, AgentRole.PA],
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
          required: ['content'],
        },
        execute: async (args, ctx) => {
          const memory = await this.memoryService.upsertPreference({
            content: String(args.content),
            tags: (args.tags as string[]) || ['preference'],
            accountId: ctx.accountId,
            userId: ctx.userId,
          });
          return { id: entityId(memory), kind: memory.kind };
        },
      },
      {
        name: 'create_task',
        description: 'Create and optionally enqueue an agent-managed task.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string' },
            priority: { type: 'number' },
            enqueue: { type: 'boolean' },
          },
          required: ['title'],
        },
        execute: async (args, ctx) => {
          const task = await this.taskService.create({
            title: String(args.title),
            description: args.description ? String(args.description) : undefined,
            type: (args.type as AgentTaskType) || AgentTaskType.GENERIC,
            priority: typeof args.priority === 'number' ? args.priority : 3,
            enqueue: args.enqueue !== false,
            ownerRole: ctx.role as AgentRole,
            accountId: ctx.accountId,
            userId: ctx.userId,
            sessionId: ctx.sessionId,
          });
          return { id: entityId(task), status: task.status, type: task.type };
        },
      },
      {
        name: 'list_tasks',
        description: 'List recent agent tasks.',
        parameters: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            limit: { type: 'number' },
          },
        },
        execute: async (args, ctx) => {
          const tasks = await this.taskService.list({
            accountId: ctx.accountId,
            userId: ctx.userId,
            status: args.status as AgentTaskStatus | undefined,
            limit: typeof args.limit === 'number' ? args.limit : 20,
          });
          return tasks.map((t) => ({
            id: entityId(t),
            title: t.title,
            status: t.status,
            type: t.type,
            priority: t.priority,
          }));
        },
      },
      {
        name: 'update_task',
        description: 'Update task status / result.',
        roles: [AgentRole.PM, AgentRole.PA, AgentRole.TWIN],
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            status: { type: 'string' },
            result: { type: 'object' },
            error: { type: 'string' },
          },
          required: ['taskId', 'status'],
        },
        execute: async (args) => {
          const task = await this.taskService.updateStatus(
            String(args.taskId),
            args.status as AgentTaskStatus,
            {
              result: (args.result as Record<string, unknown>) || undefined,
              error: args.error ? String(args.error) : undefined,
            },
          );
          return { id: entityId(task), status: task.status };
        },
      },
      {
        name: 'run_build',
        description:
          'Queue or run a local project build (pnpm build). Requires LOCAL_AGENT_ALLOW_BUILDS=true for sync execution.',
        roles: [AgentRole.PM, AgentRole.TWIN],
        parameters: {
          type: 'object',
          properties: {
            script: { type: 'string' },
            sync: { type: 'boolean' },
          },
        },
        execute: async (args, ctx) => {
          const script = String(args.script || 'build');
          const allowed = ['build', 'build:strict', 'lint', 'test'];
          if (!allowed.includes(script)) {
            throw new Error(`Script not allowed: ${script}`);
          }

          if (args.sync === true) {
            if (!this.config.allowLocalBuilds) {
              throw new Error(
                'Sync builds disabled. Set LOCAL_AGENT_ALLOW_BUILDS=true or enqueue instead.',
              );
            }
            const { stdout, stderr } = await execFileAsync(
              'pnpm',
              ['run', script],
              {
                cwd: process.cwd(),
                timeout: 10 * 60 * 1000,
                maxBuffer: 5 * 1024 * 1024,
              },
            );
            return {
              mode: 'sync',
              script,
              stdout: stdout.slice(-4000),
              stderr: stderr.slice(-2000),
            };
          }

          const task = await this.taskService.create({
            title: `Build: pnpm run ${script}`,
            type: AgentTaskType.BUILD,
            ownerRole: AgentRole.PM,
            accountId: ctx.accountId,
            userId: ctx.userId,
            sessionId: ctx.sessionId,
            priority: 4,
            payload: { script },
          });
          return { mode: 'queued', taskId: entityId(task), script };
        },
      },
      {
        name: 'draft_marketing',
        description: 'Draft marketing copy / GTM outline from a brief.',
        roles: [AgentRole.CMO, AgentRole.TWIN, AgentRole.PA],
        parameters: {
          type: 'object',
          properties: {
            brief: { type: 'string' },
            channel: { type: 'string' },
            tone: { type: 'string' },
          },
          required: ['brief'],
        },
        execute: async (args, ctx) => {
          const channel = String(args.channel || 'linkedin');
          const tone = String(args.tone || 'confident-precise');
          const brief = String(args.brief);
          const draft = {
            channel,
            tone,
            headline: `Trade documents that move as fast as your deals`,
            body:
              `${brief}\n\n` +
              `Paiperless turns trade paperwork into verifiable, shareable assets — ` +
              `so credit, ops, and counterparties work from one source of truth.`,
            cta: 'See how issuance + verification works',
            notes: ['Keep TradeTrust claims accurate', 'Lead with time-to-trust'],
          };
          await this.memoryService.store({
            kind: MemoryKind.EPISODIC,
            content: `Marketing draft (${channel}): ${draft.headline}`,
            tags: ['marketing', channel],
            accountId: ctx.accountId,
            userId: ctx.userId,
            sessionId: ctx.sessionId,
            role: AgentRole.CMO,
            importance: 0.55,
            metadata: draft,
          });
          return draft;
        },
      },
      {
        name: 'platform_status',
        description: 'Return local agent + provider configuration status.',
        parameters: { type: 'object', properties: {} },
        execute: async () => ({
          enabled: this.config.enabled,
          provider: this.config.provider,
          projectId: this.config.projectId || null,
          location: this.config.location,
          chatModel: this.config.chatModel,
          embeddingModel: this.config.embeddingModel,
          allowLocalBuilds: this.config.allowLocalBuilds,
        }),
      },
    ];
  }
}
