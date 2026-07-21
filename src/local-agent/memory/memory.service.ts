import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { AgentMemory } from './schemas/agent-memory.schema';
import { MemoryKind, AgentRole } from '../local-agent.constants';
import { VertexAiService } from '../gcp/vertex-ai.service';
import type { LocalAgentConfig } from '../config/local-agent.config';
import { entityId } from '../local-agent.utils';

export interface StoreMemoryInput {
  kind: MemoryKind;
  content: string;
  accountId?: string;
  userId?: string;
  sessionId?: string;
  role?: AgentRole;
  tags?: string[];
  importance?: number;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface RecallQuery {
  query: string;
  accountId?: string;
  userId?: string;
  sessionId?: string;
  kinds?: MemoryKind[];
  topK?: number;
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    @InjectModel(AgentMemory.name)
    private readonly memoryModel: Model<AgentMemory>,
    private readonly vertexAi: VertexAiService,
    private readonly configService: ConfigService,
  ) {}

  private get config(): LocalAgentConfig {
    return this.configService.get<LocalAgentConfig>('localAgent')!;
  }

  async store(input: StoreMemoryInput): Promise<AgentMemory> {
    const embedding = await this.safeEmbed(input.content);
    const doc = await this.memoryModel.create({
      ...input,
      tags: input.tags || [],
      importance: input.importance ?? 0.5,
      metadata: input.metadata || {},
      embedding,
    });
    this.logger.debug(`Stored ${input.kind} memory ${entityId(doc)}`);
    return doc;
  }

  async upsertPreference(input: {
    content: string;
    accountId?: string;
    userId?: string;
    tags?: string[];
  }): Promise<AgentMemory> {
    const filter: Record<string, unknown> = {
      kind: MemoryKind.PREFERENCE,
      content: input.content,
    };
    if (input.userId) filter.userId = input.userId;
    if (input.accountId) filter.accountId = input.accountId;

    const embedding = await this.safeEmbed(input.content);
    return this.memoryModel.findOneAndUpdate(
      filter,
      {
        $set: {
          content: input.content,
          tags: input.tags || ['preference'],
          importance: 0.9,
          embedding,
          accountId: input.accountId,
          userId: input.userId,
        },
      },
      { upsert: true, new: true },
    );
  }

  async recall(query: RecallQuery): Promise<
    Array<{ memory: AgentMemory; score: number }>
  > {
    const topK = query.topK ?? this.config.memoryTopK;
    const filter: Record<string, unknown> = {};
    if (query.accountId) filter.accountId = query.accountId;
    if (query.userId) filter.userId = query.userId;
    if (query.kinds?.length) filter.kind = { $in: query.kinds };

    const candidates = await this.memoryModel
      .find(filter)
      .sort({ importance: -1, createdAt: -1 })
      .limit(Math.max(topK * 8, 40))
      .exec();

    if (!candidates.length) {
      return [];
    }

    const queryEmbedding = await this.safeEmbed(query.query);
    const scored = candidates
      .map((memory) => ({
        memory,
        score: this.hybridScore(query.query, queryEmbedding, memory),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  async listWorking(sessionId: string, limit?: number): Promise<AgentMemory[]> {
    return this.memoryModel
      .find({ sessionId, kind: MemoryKind.WORKING })
      .sort({ createdAt: -1 })
      .limit(limit ?? this.config.workingMemoryLimit)
      .exec();
  }

  async consolidateSession(sessionId: string, summary: string): Promise<AgentMemory> {
    return this.store({
      kind: MemoryKind.EPISODIC,
      content: summary,
      sessionId,
      tags: ['session-summary', 'consolidation'],
      importance: 0.7,
    });
  }

  formatForPrompt(
    items: Array<{ memory: AgentMemory; score: number }>,
  ): string {
    if (!items.length) return 'No relevant long-term memories.';
    return items
      .map(
        ({ memory, score }, idx) =>
          `${idx + 1}. [${memory.kind}|score=${score.toFixed(3)}] ${memory.content}`,
      )
      .join('\n');
  }

  private async safeEmbed(text: string): Promise<number[]> {
    try {
      const result = await this.vertexAi.embed(text);
      if (result.values?.length) return result.values;
    } catch (error) {
      this.logger.warn(`Embedding failed, using local hash: ${(error as Error).message}`);
    }
    return this.vertexAi.localHashEmbedding(text);
  }

  private hybridScore(
    query: string,
    queryEmbedding: number[],
    memory: AgentMemory,
  ): number {
    const cosine = this.cosineSimilarity(queryEmbedding, memory.embedding || []);
    const lexical = this.lexicalOverlap(query, memory.content);
    const importance = memory.importance ?? 0.5;
    return cosine * 0.7 + lexical * 0.2 + importance * 0.1;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || !b.length || a.length !== b.length) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom ? dot / denom : 0;
  }

  private lexicalOverlap(query: string, content: string): number {
    const q = new Set(query.toLowerCase().split(/\W+/).filter(Boolean));
    const c = new Set(content.toLowerCase().split(/\W+/).filter(Boolean));
    if (!q.size || !c.size) return 0;
    let overlap = 0;
    for (const token of q) {
      if (c.has(token)) overlap += 1;
    }
    return overlap / q.size;
  }
}
