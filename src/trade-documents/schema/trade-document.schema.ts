import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  BillOfExchangeContent,
  InvoiceContent,
  OtherDocumentContent,
  PromissoryNoteContent,
} from './document-content.schema';
import { TradeDocumentType } from '../../types/trade-documents.types';
import { TradeTrustDocumentClass } from '../../trade-trust/trade-trust.types';
import { TradeDocumentFileStatus } from '../trade-document-file.types';


@Schema({_id: false, timestamps: false})
export class TradeDocumentClaimantDetails {
  @Prop({required: true})
  walletAddress: string;
  @Prop({required: false})
  name?: string;
  @Prop({required: false})
  contactEmail?: string;
}

@Schema({_id: false, timestamps: false})
export class TradeDocumentClaimants {
  @Prop({required: true, type: TradeDocumentClaimantDetails})
  holder?: TradeDocumentClaimantDetails;
  @Prop({required: true, type: TradeDocumentClaimantDetails})
  beneficiary?: TradeDocumentClaimantDetails;
}

@Schema({_id: false, timestamps: false})
export class IssueDetails {
  @Prop({required: false, enum: TradeTrustDocumentClass, type: String})
  documentClass?: TradeTrustDocumentClass

  @Prop({required: false, type: Date})
  dateIssued?: Date;

  @Prop({required: false})
  chainId?: number

  @Prop({required: false})
  contractAddress?: string;

  @Prop({required: false})
  transactionHash?: string;

  @Prop({required:false, type: String})
  merkleRoot?: string;

  @Prop({required: false, type: String})
  wrappedContent?: string;

}

@Schema({timestamps: true, _id: false})
export class TradeDocumentFile {
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

  @Prop({required: true, enum: TradeDocumentFileStatus})
  status: TradeDocumentFileStatus;
}

@Schema({ timestamps: true })
export class TradeDocument {

  @Prop({required: true})
  accountId: string;

  @Prop({required: true})
  documentReference: string;

  @Prop({ required: true, enum: TradeDocumentType })
  documentType: TradeDocumentType;

  @Prop()
  status: string;

  @Prop({required: false})
  dateIssued: Date;

  @Prop({required: false, type: TradeDocumentFile, })
  originalFile: TradeDocumentFile;

  @Prop({required: false, type: TradeDocumentFile, })
  issuedFile: TradeDocumentFile;

  @Prop({required: false, type: TradeDocumentFile, })
  tradeTrustFile: TradeDocumentFile;

  @Prop({ type: Object, required: false })
  documentContent: object;

  @Prop({type: IssueDetails, required: false})
  issueDetails?: IssueDetails

  @Prop({ type: TradeDocumentClaimants, required: false })
  claimants?: TradeDocumentClaimants;

  @Prop({required: false})
  verifiableDataUrlHash: string;

  @Prop({required: false})
  documentTrackingId: string;

}

export type TradeDocumentDocument = TradeDocument & Document;
export const TradeDocumentSchema = SchemaFactory.createForClass(TradeDocument);