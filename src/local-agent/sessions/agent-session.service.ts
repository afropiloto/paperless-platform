import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { AgentSession } from './schemas/agent-session.schema';
import { AgentRole } from '../local-agent.constants';
import type { ChatMessage } from '../local-agent.types';

@Injectable()
export class AgentSessionService {
  private readonly logger = new Logger(AgentSessionService.name);

  constructor(
    @InjectModel(AgentSession.name)
    private readonly sessionModel: Model<AgentSession>,
  ) {}

  async getOrCreate(input: {
    sessionId?: string;
    accountId?: string;
    userId?: string;
    role?: AgentRole;
  }): Promise<AgentSession> {
    if (input.sessionId) {
      const existing = await this.sessionModel.findOne({ sessionId: input.sessionId }).exec();
      if (existing) {
        existing.lastActiveAt = new Date();
        if (input.role && input.role !== AgentRole.AUTO) {
          existing.activeRole = input.role;
        }
        await existing.save();
        return existing;
      }
    }

    const sessionId = input.sessionId || randomUUID();
    const created = await this.sessionModel.create({
      sessionId,
      accountId: input.accountId,
      userId: input.userId,
      activeRole: input.role || AgentRole.AUTO,
      messages: [],
      workingState: {},
      lastActiveAt: new Date(),
    });
    this.logger.debug(`Created agent session ${sessionId}`);
    return created;
  }

  async appendMessages(sessionId: string, messages: ChatMessage[]): Promise<AgentSession> {
    const session = await this.sessionModel.findOneAndUpdate(
      { sessionId },
      {
        $push: { messages: { $each: messages } },
        $set: { lastActiveAt: new Date() },
      },
      { new: true },
    );
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return session;
  }

  async getRecentMessages(sessionId: string, limit = 20): Promise<ChatMessage[]> {
    const session = await this.sessionModel.findOne({ sessionId }).exec();
    if (!session) return [];
    return (session.messages || []).slice(-limit);
  }
}
