import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({timestamps: true})
export class NamedWallet {
  @Prop({required: true})
  accountId: string;

  @Prop({required: true})
  walletAddress: string;

  @Prop({required: true})
  walletName: string;

  @Prop({required: false})
  emailAddress: string;
}

export const NamedWalletSchema = SchemaFactory.createForClass(NamedWallet);