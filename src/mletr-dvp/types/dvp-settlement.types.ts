export enum DvpSettlementStatus {
  DRAFT = 'DRAFT',
  PENDING_AGENT_REVIEW = 'PENDING_AGENT_REVIEW',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  DOCUMENT_TRANSFER_IN_PROGRESS = 'DOCUMENT_TRANSFER_IN_PROGRESS',
  PAYMENT_RELEASED = 'PAYMENT_RELEASED',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum StablecoinType {
  USDC = 'USDC',
  USDT = 'USDT',
  MOCK = 'MOCK',
}

export interface MletrDocumentAttributes {
  /** UNCITRAL mLETR jurisdiction where the electronic record is governed */
  governingLaw?: string;
  /** Whether the document qualifies as an electronic transferable record under mLETR */
  isElectronicTransferableRecord: boolean;
  /** Control/possession method per mLETR (e.g. token-based via TrustVC) */
  controlMethod: 'TOKEN_REGISTRY' | 'VERIFIABLE_RECORD';
  /** Document reference from parsed content (BL number, invoice number, etc.) */
  documentReference?: string;
  /** Parties extracted from AI-parsed document content */
  sellerParty?: string;
  buyerParty?: string;
}

export interface SettlementPaymentDetails {
  stablecoin: StablecoinType;
  amount: string;
  /** Amount in smallest token unit (wei for 18 decimals) */
  amountAtomic: string;
  tokenContractAddress: string;
  decimals: number;
  buyerWalletAddress: string;
  sellerWalletAddress: string;
  escrowWalletAddress: string;
  paymentTxHash?: string;
  releaseTxHash?: string;
}

export interface SettlementDocumentDetails {
  tradeDocumentId: string;
  documentType: string;
  merkleRoot?: string;
  tokenId?: string;
  transferTxHash?: string;
  beneficiaryAddress?: string;
  holderAddress?: string;
}

export interface AgentDecisionLog {
  timestamp: Date;
  action: string;
  reasoning: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}
