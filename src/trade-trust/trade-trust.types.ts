export interface TradeDocumentIssueJob {
  accountId: string;
  documentId: string;
  documentType: string;
}


export enum TradeTrustDocumentClass {
  VERIFIABLE,
  TRANSFERABLE
}


export interface WrappedDocumentDetails {
  merkleRoot: string,
  wrappedContent: string,
}

export interface TradeTrustFileDetails {
  fileName: string,
  mimeType: string,
  dataUrl: string,
}