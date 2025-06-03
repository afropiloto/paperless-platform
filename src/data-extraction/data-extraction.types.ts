
import { DocumentContent } from '../trade-documents/dtos/trade-document.dto';


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
  documentContent?: DocumentContent
}