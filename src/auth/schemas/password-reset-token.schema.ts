import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PasswordResetToken extends Document {
  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'AccountUser' })
  userId: Types.ObjectId;

  @Prop({ required: true, index: { expireAfterSeconds: 0 } })
  expiresAt: Date;

  @Prop({ required: true, default: false })
  used: boolean;

  @Prop({ type: Date })
  usedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);

// Create TTL index for automatic cleanup of expired tokens
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 