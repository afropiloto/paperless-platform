export enum DocumentSigningRole {
  ISSUER="ISSUER",
  SIGNER="SIGNER"
}

export enum DocumentSigningStatus {
  PENDING="PENDING",
  IN_PROGRESS="IN_PROGRESS",
  SIGNED="SIGNED",
  EXPIRED="EXPIRED",
  REVOKED="REVOKED",
}

export interface DocumentSigningFilterByParams {
  walletAddress?: string;
  accountId?: string;
}
