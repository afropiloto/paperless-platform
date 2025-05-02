import { Types } from 'mongoose';

export function isValidDocumentIdFormat(documentId: string): boolean {
  return Types.ObjectId.isValid(documentId);
}

export function isValidAccountIdFormat(accountId: string): boolean {
  return Types.ObjectId.isValid(accountId);
}
export function isValidTrackingIdFormat(trackingId: string): boolean {
  const regex = new RegExp(/^[{]?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}[}]?$/);

  return regex.test(trackingId) == true;
}