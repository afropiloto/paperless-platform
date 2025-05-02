import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({timestamps: true})
export class ChainLookup {
  @Prop({ required: true })
  chainName: string;

  @Prop({ required: true })
  chainId: string;

  @Prop({ required: true })
  rpcUrl: string;

  @Prop({ required: true })
  gasStation: string;
}

export const ChainLookupSchema = SchemaFactory.createForClass(ChainLookup);