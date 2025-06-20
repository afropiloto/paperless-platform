import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class NoteEntry {
  @Prop({ required: true })
  note: string;

  @Prop({ required: true })
  user?: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const NoteEntrySchema = SchemaFactory.createForClass(NoteEntry);