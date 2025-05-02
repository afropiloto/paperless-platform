import {
  BillOfExchangeContent,
  InvoiceContent,
  OtherDocumentContent,
  PromissoryNoteContent,
} from '../types/trade-documents.types';


export interface DataExtractionJob {
  accountId: string;
  documentId: string;
  documentType: string;
}

export interface GraipDataExtractionCallBackJob extends DataExtractionJob {
  requestId: string;
  flowId: string;

}

export interface DataExtractionResponse {
  success: boolean;
  message?: string;
  requestId?: string;
  data?: {
    invoiceContent?: InvoiceContent;
    billOfExchangeContent?: BillOfExchangeContent;
    promissoryNoteContent?: PromissoryNoteContent;
    otherDocumentContent?: OtherDocumentContent;
  }
}