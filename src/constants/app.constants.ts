export const DATA_EXTRACTION_QUEUE_NAME="data-extraction"
export const DATA_EXTRACTION_EVENT = "data-extraction-event"
export const DATA_EXTRACTION_GRAIP_CALLBACK_EVENT = "data-extraction-graip-callback-event"

export const TRADE_DOCUMENT_QUEUE="trade-document-queue"
export const TT_FILE_QUEUE = 'tt-file-queue';
export const ISSUED_FILE_QUEUE = 'issued-file-queue';
export const MINT_DOCUMENT_QUEUE = 'mint-document-queue';
export const FINALISE_ISSUE_QUEUE = 'finalise-issue-queue';

// Document Signing
export const CREATE_DOCUMENT_SIGNING_EVENT_QUEUE = 'create-document-signing-event-queue';

export const CREATE_DOCUMENT_SIGNING_FINALISE_EVENT = 'finalise-signing-event-creation';
export const CREATE_DOCUMENT_SIGNING_ON_CHAIN_EVENT = 'create-on-chain-signing-event';
export const CREATE_DOCUMENT_SIGNING_OFF_CHAIN_EVENT = 'create-off-chain-document-signing-event';

export const SIGN_DOCUMENT_ON_BEHALF_QUEUE = 'sign-document-on-behalf-queue';

export const CREATE_DOCUMENT_SIGNING_EVENT = 'create-document-signing-event';
export const SIGN_DOCUMENT_EVENT = 'sign-document-event';

export const DEEP_VIRUS_SCAN_QUEUE_NAME='deep-virus-scan'

export enum AccountsQueue {
  NEW_ACCOUNT_QUEUE = 'new-account-queue',
}

export enum AccountsEvents {
  NEW_ACCOUNT_APPROVED = 'new-account-approved',
}

export enum DealDeskQueues  {
  CUSTOMER_FUNDING_REQUESTS="customer-funding-requests"
}

export const DOCUMENT_SIGNING_BATCH_CHECK_QUEUE = 'document-signing-batch-check-queue';
export const DOCUMENT_SIGNING_BATCH_CHECK_EVENT = 'document-signing-batch-check-event';

export enum DealDeskEvents {
  NEW_FUNDING_REQUEST="NEW_FUNDING_REQUEST",
  WITHDRAW_FUNDING_REQUEST="WITHDRAW_FUNDING_REQUEST",
}

export enum OnboardingQueues {
  NEW_ONBOARDING_REQUESTS="new-onboarding-request-queue",
}

export enum OnboardingEvents {
  NEW_REGISTRATION = 'new-registration',
}