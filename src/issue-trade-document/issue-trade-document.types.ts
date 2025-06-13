export interface IssueJobData {
  accountId: string;
  documentId: string;
  isTransferrable?: boolean;
  issueDate?: Date;
  documentTrackingId?: string;
  documentReference?: string;
}