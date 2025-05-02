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
import { TradeDocumentClaimantDetailsDto } from '../dtos/trade-document.dto';


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
  dataUrl: string;

  @Prop({required: true})
  fileName: string;

  @Prop({required: true})
  mimeType: string;

  @Prop({required: true})
  fileSize: string;
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

  @Prop({type: TradeDocumentFile, required: false})
  tradeDocumentFile: TradeDocumentFile;

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
      if (!doc.invoiceContent) {
        return next(new Error('Invoice documents require invoiceContent'));
      }
      break;
    case TradeDocumentType.PROMISSORY_NOTE:
      if (!doc.promissoryNoteContent) {
        return next(
          new Error('Promissory note documents require promissoryNoteContent'),
        );
      }
      break;
    case TradeDocumentType.BILL_OF_EXCHANGE:
      if (!doc.billOfExchangeContent) {
        return next(
          new Error('Bill of exchange documents require billOfExchangeContent'),
        );
      }
      break;
    case TradeDocumentType.OTHER:
      if (!doc.otherDocumentContent) {
        return next(new Error('Other documents require otherDocumentContent'));
      }
      break;
    default:
      return next(new Error('Invalid document type'));
  }

  next();
});