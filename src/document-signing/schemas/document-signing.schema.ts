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

@Schema({ timestamps: true })
export class DocumentSigning extends Document {
  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: String })
  documentSigningAddress: string;

  @Prop({ type: String, required: true })
  documentId: string;

  @Prop({
    type: [String],
    required: true,
    default: [],
  })
  signers: SignerDetails[];

  @Prop({type: String, enum: DocumentSigningStatus, required: true})
  lastKnownStatus: DocumentSigningStatus;

  @Prop({ type: Date, required: true })
  expiryDate: Date;
}

export const DocumentSigningSchema = SchemaFactory.createForClass(DocumentSigning);