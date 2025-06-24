import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Client {
  @Prop({required: true, unique: true})
  keyId: string;

  @Prop({required: true})
  apiKeyHash: string;

  @Prop([String])
  accessGroups: string[];

  @Prop()
  name: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);