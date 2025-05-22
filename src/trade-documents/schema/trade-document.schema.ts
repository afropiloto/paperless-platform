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

@Schema({timestamps: false, _id: false})
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

  @Prop({type: InvoiceContent, required: false})
  invoiceContent?: InvoiceContent;

  @Prop({type: BillOfExchangeContent, required: false})
  billOfExchangeContent?: BillOfExchangeContent;

  @Prop({type: PromissoryNoteContent, required: false})
  promissoryNoteContent?: PromissoryNoteContent;

  @Prop({type: OtherDocumentContent, required: false})
  otherDocumentContent?: OtherDocumentContent;


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

// Add validation to ensure the correct details are provided based on documentType
TradeDocumentSchema.pre('validate', function (next) {
  const doc = this as TradeDocumentDocument;

  switch (doc.documentType) {
    case TradeDocumentType.INVOICE:
      if (doc.promissoryNoteContent || doc.billOfExchangeContent || doc.otherDocumentContent) {
        return next(new Error('Invoice documents should not contain promissoryNoteContent, billOfExchangeContent or otherDocumentContent'));
      }
      break;
    case TradeDocumentType.PROMISSORY_NOTE:
      if (doc.invoiceContent || doc.billOfExchangeContent || doc.otherDocumentContent) {
        return next(
          new Error('Promissory note documents should not contain invoiceContent, billOfExchangeContent or otherDocumentContent'),
        );
      }
      break;
    case TradeDocumentType.BILL_OF_EXCHANGE:
      if (doc.invoiceContent || doc.promissoryNoteContent || doc.otherDocumentContent) {
        return next(
          new Error('Bill of exchange documents should not contain invoiceContent, promissoryNoteContent or otherDocumentContent'),
        );
      }
      break;
    case TradeDocumentType.OTHER:
      if (doc.invoiceContent || doc.promissoryNoteContent || doc.billOfExchangeContent) {
        return next(new Error('Other documents require should not contain invoiceContent, promissoryNoteContent or billOfExchangeContent'));
      }
      break;
    default:
      return next(new Error('Invalid document type'));
  }

  next();
});