import {
  BillOfExchangeContentDto,
  InvoiceContentDto, OtherDocumentContentDto,
  PromissoryNoteContentDto,
} from '../trade-documents/dtos/trade-document.dto';


export interface DataExtractionJob {
  accountId: string;
  documentId: string;
  documentType: string;
}

export interface ExtendAIDataExtractionCallBackJob extends DataExtractionJob {
  runId: string;
}

export interface DataExtractionResponse {
  success: boolean;
  message?: string;
  requestId?: string;
  documentContent?: InvoiceContentDto | BillOfExchangeContentDto | PromissoryNoteContentDto | OtherDocumentContentDto;
}