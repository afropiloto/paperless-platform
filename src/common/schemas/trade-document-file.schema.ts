import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TradeDocumentFileStatus } from '../types/trade-document.types';

@Schema({timestamps: true, _id: false})
export class TradeDocumentFile extends Document {
  @Prop({required: true})
  storedFileName: string;

  @Prop({required: true})
  storedFilePath: string;

  @Prop({required: true})
  originalFileName: string;

  @Prop({required: true})
  mimeType: string;

  @Prop({required: true})
  size: number;

  @Prop({required: true, type: String, enum: Object.values(TradeDocumentFileStatus)})
  status: TradeDocumentFileStatus;
}

export const TradeDocumentFileSchema = SchemaFactory.createForClass(TradeDocumentFile); 