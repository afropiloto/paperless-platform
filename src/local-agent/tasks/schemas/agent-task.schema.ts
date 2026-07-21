import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  AgentRole,
  AgentTaskStatus,
  AgentTaskType,
} from '../../local-agent.constants';

@Schema({ timestamps: true, collection: 'agent_tasks' })
export class AgentTask {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ type: String, enum: AgentTaskType, default: AgentTaskType.GENERIC })
  type: AgentTaskType;

  @Prop({ type: String, enum: AgentTaskStatus, default: AgentTaskStatus.PENDING, index: true })
  status: AgentTaskStatus;

  @Prop({ type: String, enum: AgentRole, default: AgentRole.PM })
  ownerRole: AgentRole;

  @Prop({ type: String, required: false, index: true })
  accountId?: string;

  @Prop({ type: String, required: false, index: true })
  userId?: string;

  @Prop({ type: String, required: false })
  sessionId?: string;

  @Prop({ type: Number, default: 3, min: 1, max: 5 })
  priority: number;

  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  result: Record<string, unknown>;

  @Prop({ type: String, required: false })
  error?: string;

  @Prop({ type: Date, required: false })
  dueAt?: Date;

  @Prop({ type: Date, required: false })
  startedAt?: Date;

  @Prop({ type: Date, required: false })
  completedAt?: Date;
}

export const AgentTaskSchema = SchemaFactory.createForClass(AgentTask);
AgentTaskSchema.index({ status: 1, priority: -1, createdAt: 1 });
