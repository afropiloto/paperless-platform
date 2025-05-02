import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AuditEventType } from '../audit-event-type.enum';

@Schema({ timestamps: true })
export class AuditEvent extends Document {
  @Prop({ required: true, enum: AuditEventType })
  eventType: AuditEventType;

  @Prop({ required: true })
  accountId: string;

  @Prop()
  documentId?: string;

  @Prop({ required: true })
  originator: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: Object, default: {} })
  details: Record<string, any>;
}

export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);