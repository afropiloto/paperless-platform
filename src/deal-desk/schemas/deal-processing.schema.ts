import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ChecklistItemStatus, DealProcessingStatus, FundingDecisionType } from '../types/deal-desk.types';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum } from 'class-validator';
import { PromissoryNoteState } from '../dto/deal-processing-response.dto';
import { TradeDocumentFile } from '../../common/schemas/trade-document-file.schema';

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

  @Prop({ type: [NoteEntry], default: [] })
  @Type(() => NoteEntry)
  notes: NoteEntry[];
}

@Schema({ timestamps: false, _id: false })
export class Section {
  @Prop({ required: true })
  title: string;


  @Prop({ type: [ChecklistItem], default: [] })
  items: ChecklistItem[];
}

@Schema({timestamps: true})
export class FundingDecisionDetails extends Document {
  @Prop({
    type: String,
    enum: FundingDecisionType,
    default: FundingDecisionType.PENDING,
  })
  decision: FundingDecisionType;

  @Prop({type: NoteEntry})
  decisionNotes?: NoteEntry
}

@Schema({ timestamps: true })
export class PromissoryNoteDetails extends Document {
  @Prop({ type: Object, default: {} })
  content: any;

  @Prop(
    {type: String,
      enum: PromissoryNoteState,
      default: PromissoryNoteState.IN_PROGRESS
    })
  status: PromissoryNoteState;

  @Prop({ type: TradeDocumentFile })
  issuedFile?: TradeDocumentFile;
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
  dueDiligenceChecklistVersion: number;

  @Prop({ type: [Section], default: [] })
  dueDiligenceChecks: Section[];

  @Prop({
    type: FundingDecisionDetails
  })
  fundingDecision: FundingDecisionDetails;

  @Prop({ type: String })
  fundingDecisionNotes: string;

  @Prop({ type: Date })
  fundingDecisionDate: Date;

  @Prop({ type: PromissoryNoteDetails, required: false })
  promissoryNote: PromissoryNoteDetails;
}

export const DealProcessingSchema = SchemaFactory.createForClass(DealProcessing); 