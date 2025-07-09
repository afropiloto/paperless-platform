import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AuditEventType, AuditSubject } from '../audit-event-type.enum';

@Schema({ timestamps: true })
export class AuditEvent extends Document {
  @Prop({ required: true, enum: AuditSubject })
  subject: AuditSubject;

  @Prop({ required: true, enum: AuditEventType })
  eventType: AuditEventType;

  @Prop({ required: true })
  identifier: string;

  @Prop({ required: false })
  accountId: string;

  @Prop({required: false})
  originator: string;

  @Prop({ required: false })
  userId: string;

  @Prop({ type: Object, default: {} })
  details: Record<string, any>;
}

export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);