import { DocumentSigningRole } from './document-signing.types';

export interface PartyDetails {
  walletAddress: string;
  name: string;
  role: DocumentSigningRole
}

export interface CreateDocumentSigningEventJobData {
  documentId: string;
  accountId: string;
  description: string;
  expiryDate: Date;
  parties: PartyDetails[]
}

export interface SignDocumentOnBehalfJobData {
  signingId: string;
}