import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AgentRole, MemoryKind } from '../../local-agent.constants';

@Schema({ timestamps: true, collection: 'agent_memories' })
export class AgentMemory {
  @Prop({ required: true, enum: MemoryKind, type: String, index: true })
  kind: MemoryKind;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, required: false, index: true })
  accountId?: string;

  @Prop({ type: String, required: false, index: true })
  userId?: string;

  @Prop({ type: String, required: false, index: true })
  sessionId?: string;

  @Prop({ type: String, enum: AgentRole, required: false })
  role?: AgentRole;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [Number], default: [] })
  embedding: number[];

  @Prop({ type: Number, default: 0.5 })
  importance: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop({ type: Date, required: false })
  expiresAt?: Date;
}

export const AgentMemorySchema = SchemaFactory.createForClass(AgentMemory);
AgentMemorySchema.index({ content: 'text', tags: 'text' });
AgentMemorySchema.index({ accountId: 1, kind: 1, createdAt: -1 });
