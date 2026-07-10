import { DvpSettlementStatus } from './dvp-settlement.types';

export enum AgentAction {
  VALIDATE_MLETR_COMPLIANCE = 'VALIDATE_MLETR_COMPLIANCE',
  EXTRACT_SETTLEMENT_TERMS = 'EXTRACT_SETTLEMENT_TERMS',
  REQUEST_PAYMENT = 'REQUEST_PAYMENT',
  CONFIRM_PAYMENT = 'CONFIRM_PAYMENT',
  TRANSFER_DOCUMENT = 'TRANSFER_DOCUMENT',
  RELEASE_FUNDS = 'RELEASE_FUNDS',
  COMPLETE_SETTLEMENT = 'COMPLETE_SETTLEMENT',
  REJECT_SETTLEMENT = 'REJECT_SETTLEMENT',
  ESCALATE = 'ESCALATE',
}

export interface AgentToolResult {
  success: boolean;
  action: AgentAction;
  message: string;
  data?: Record<string, unknown>;
}

export interface SettlementTerms {
  amount: string;
  amountAtomic: string;
  currency: string;
  sellerParty: string;
  buyerParty: string;
  documentReference: string;
  dueDate?: string;
}

export interface AgentOrchestrationResult {
  recommendedStatus: DvpSettlementStatus;
  nextActions: AgentAction[];
  settlementTerms?: SettlementTerms;
  decisions: Array<{
    action: AgentAction;
    reasoning: string;
    confidence: number;
  }>;
  compliant: boolean;
  complianceNotes: string[];
}
