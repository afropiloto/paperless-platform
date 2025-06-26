import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  DealProcessingStatus,
  FundingDecisionType,
} from '../types/deal-desk.types';
import { NoteEntry } from '../../common/schemas/note-entry.schema';


@Schema({ timestamps: true })
export class FundingDecisionDetails extends Document {
  @Prop({
    type: String,
    enum: FundingDecisionType,
    default: FundingDecisionType.PENDING,
  })
  decision: FundingDecisionType;

  @Prop({ type: NoteEntry })
  decisionNotes?: NoteEntry;
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

  @Prop()
  dueDiligenceChecklistId: string;

  @Prop({
    type: FundingDecisionDetails,
  })
  fundingDecision: FundingDecisionDetails;

  @Prop({ type: String })
  fundingDecisionNotes: string;

  @Prop({ type: Date })
  fundingDecisionDate: Date;

  @Prop({type: String, required: false})
  signingEventId?: string;

  @Prop({ type: String, required: false })
  promissoryNoteId?: string;
}

export const DealProcessingSchema =
  SchemaFactory.createForClass(DealProcessing);