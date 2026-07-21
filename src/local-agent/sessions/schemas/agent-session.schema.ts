import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AgentRole } from '../../local-agent.constants';
import type { ChatMessage } from '../../local-agent.types';

@Schema({ timestamps: true, collection: 'agent_sessions' })
export class AgentSession {
  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ type: String, required: false, index: true })
  accountId?: string;

  @Prop({ type: String, required: false, index: true })
  userId?: string;

  @Prop({ type: String, enum: AgentRole, default: AgentRole.AUTO })
  activeRole: AgentRole;

  @Prop({ type: [{ role: String, content: String, name: String }], default: [] })
  messages: ChatMessage[];

  @Prop({ type: Object, default: {} })
  workingState: Record<string, unknown>;

  @Prop({ type: Date, default: Date.now })
  lastActiveAt: Date;
}

export const AgentSessionSchema = SchemaFactory.createForClass(AgentSession);
