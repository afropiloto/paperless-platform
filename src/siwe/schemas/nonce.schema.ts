import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({timestamps: true})
export class Nonce{
  @Prop({required: true})
  wallet: string;
  @Prop({required: true})
  nonce: string;

  createdAt: Date;

}

export const NonceSchema = SchemaFactory.createForClass(Nonce);