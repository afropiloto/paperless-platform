import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ShareLinkDocument = ShareLink & Document;

@Schema({ timestamps: true })
export class ShareLink {
  @Prop({ required: true, unique: true, index: true })
  linkId: string;

  @Prop({ required: true })
  accountId: string;

  @Prop({ required: true })
  documentId: string;

  @Prop({ required: true })
  encryptedData: string;

  @Prop({ required: true })
  iv: string;

  @Prop({ required: true })
  salt: string;

  @Prop({ required: true, default: false })
  isExpired: boolean;

  @Prop()
  expiresAt?: Date;

  @Prop({ type: [String], default: [] })
  allowedEmails: string[];

  @Prop({ required: true })
  createdBy: string;

  @Prop({ default: 0 })
  accessCount: number;

  @Prop({ type: Date })
  lastAccessedAt?: Date;

  @Prop({ type: [{ email: String, accessedAt: Date }], default: [] })
  accessHistory: Array<{ email: string; accessedAt: Date }>;
}

export const ShareLinkSchema = SchemaFactory.createForClass(ShareLink); 