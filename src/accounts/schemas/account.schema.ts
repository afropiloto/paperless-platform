import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Account {
  accountId: string;

  @Prop({ required: true })
  accountName: string;

  @Prop({ required: true, unique: true })
  walletAddress: string;

  @Prop({ required: true, unique: true, lowercase: true })
  emailAddress: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
