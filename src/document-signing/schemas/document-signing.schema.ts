import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DocumentSigningRole, DocumentSigningStatus } from '../types/document-signing.types';

@Schema({timestamps: false, _id: false})
export class SignerDetails {
  @Prop({type: String, required: true})
  walletAddress: string;
  
  @Prop({type: String, required: false})
  name?: string;

  @Prop({type: String, enum: DocumentSigningRole, required: true})
  role: DocumentSigningRole;

}

@Schema({timestamps: false, _id: false})
export class DocumentSigningContract {
  @Prop({type: String, required: true})
  rpcUrl: string;

  @Prop({type: Number, required: true})
  chainId: number;

  @Prop({type: String, required: true})
  contractAddress: string;

  @Prop({type: String, required: true})
  documentId: string;
}

@Schema({ timestamps: true })
export class DocumentSigning extends Document {
  @Prop({ required: true, type: String })
  description: string;

  @Prop({ type: String, required: true })
  documentId: string;

  @Prop({type: String, required: true})
  accountId: string;

  @Prop({ type: DocumentSigningContract, required: false})
  contractDetails: DocumentSigningContract;

  @Prop({
    type: [SignerDetails],
    required: true,
    default: [],
  })
  parties: SignerDetails[];

  @Prop({type: String, enum: DocumentSigningStatus, required: true})
  lastKnownStatus: DocumentSigningStatus;

  @Prop({ type: Date, required: true })
  expiryDate: Date;
}

export const DocumentSigningSchema = SchemaFactory.createForClass(DocumentSigning);