import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ChecklistItem {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  guidance: string;
}

export const ChecklistItemSchema = SchemaFactory.createForClass(ChecklistItem);

@Schema()
export class Section {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  guidance: string;

  @Prop({ type: [ChecklistItemSchema], required: true })
  items: ChecklistItem[];
}

export const SectionSchema = SchemaFactory.createForClass(Section);

@Schema()
export class DueDiligenceChecklist extends Document {
  @Prop({ required: true, unique: true, index: true })
  version: number;

  @Prop({ type: [SectionSchema], required: true })
  sections: Section[];
}

export const DueDiligenceChecklistSchema = SchemaFactory.createForClass(DueDiligenceChecklist); 