import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ChecklistItemStatus, DealProcessingStatus, FundingDecisionType } from '../types/deal-desk.types';



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

@Schema({ timestamps: false, _id: false })
export class ChecklistItem {
   @Prop({ required: true })
  title: string;

  @Prop({
    type: String,
    enum: ChecklistItemStatus,
    default: ChecklistItemStatus.NOT_STARTED,
  })
  status: ChecklistItemStatus;

  @Prop({ type: [String], default: [] })
  notes: string[];
}

@Schema({ timestamps: false, _id: false })
export class Section {
  @Prop({ required: true })
  title: string;


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
  dueDiligenceChecks: Section[];

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