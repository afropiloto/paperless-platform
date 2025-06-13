import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export enum DealProcessingStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  AWAITING_AGREEMENT = 'AWAITING_AGREEMENT',
  FUNDING_REQUESTED = 'FUNDING_REQUESTED',
  FUNDS_RELEASED = 'FUNDS_RELEASED',
  LOAN_REPAID = 'LOAN_REPAID',
  WITHDRAWN = 'WITHDRAWN',
}

export enum ChecklistItemStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum FundingDecisionType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PENDING = 'PENDING',
}

@Schema()
export class NoteEntry {
  @Prop({ required: true })
  note: string;

  @Prop({ required: true })
  user: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const NoteEntrySchema = SchemaFactory.createForClass(NoteEntry);

@Schema({ timestamps: true })
export class ChecklistItem {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  order: number;

  @Prop({
    type: String,
    enum: ChecklistItemStatus,
    default: ChecklistItemStatus.NOT_STARTED,
  })
  status: ChecklistItemStatus;

  @Prop({ type: [String], default: [] })
  notes: string[];
}

@Schema({ timestamps: true })
export class Section {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  order: number;

  @Prop({ type: [ChecklistItem], default: [] })
  items: ChecklistItem[];
}

@Schema({ timestamps: true })
export class DealProcessing extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  dealId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  accountId: Types.ObjectId;

  @Prop({
    type: String,
    enum: DealProcessingStatus,
    default: DealProcessingStatus.NEW,
  })
  status: DealProcessingStatus;

  @Prop({ type: [Section], default: [] })
  sections: Section[];

  @Prop({
    type: String,
    enum: FundingDecisionType,
    default: FundingDecisionType.PENDING,
  })
  fundingDecision: FundingDecisionType;

  @Prop({ type: String })
  fundingDecisionNotes: string;

  @Prop({ type: Date })
  fundingDecisionDate: Date;
}

export const DealProcessingSchema = SchemaFactory.createForClass(DealProcessing); 