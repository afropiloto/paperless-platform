import { RegistrationDocumentType } from '../enums/document-type.enum';

export interface RegistrationDocumentFileDetails {
  storedFileName: string;
  storedFilePath: string;
  originalFilename: string;
  documentType: RegistrationDocumentType;
  mimeType: string;
  size: number;
}