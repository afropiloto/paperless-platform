import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ChecklistItemStatus } from '../../deal-desk/types/deal-desk.types';
import { Type } from 'class-transformer';
import { DueDiligenceChecklistType, CheckType } from '../types/due-diligence-checklists.types';
import { NoteEntry } from '../../common/schemas/note-entry.schema';

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

  @Prop({
    type: String,
    enum: CheckType,
    required: true,
  })
  checkType: CheckType;

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
export  class DueDiligenceChecklistInstance {
  @Prop({ required: true, enum: DueDiligenceChecklistType })
  checklistType: DueDiligenceChecklistType;

  @Prop({ required: true, type: Number})
  version: number;

  @Prop({required: true, type: [Section], default: [] })
  sections: Section[];
}


export const DueDiligenceChecklistInstanceSchema = SchemaFactory.createForClass(DueDiligenceChecklistInstance);