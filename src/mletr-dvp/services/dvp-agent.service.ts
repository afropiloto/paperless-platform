import { Injectable, Logger } from '@nestjs/common';
import {
  AgentAction,
  AgentOrchestrationResult,
  SettlementTerms,
} from '../types/dvp-agent.types';
import { DvpSettlementStatus } from '../types/dvp-settlement.types';
import { MletrDocumentService } from './mletr-document.service';
import { StablecoinPaymentService } from './stablecoin-payment.service';
import { DvpSettlementDto } from '../dtos/dvp-settlement.dto';

/**
 * Agentic orchestrator for mLETR DvP settlement.
 * Uses a tool-based decision loop to validate documents, extract terms,
 * and drive the settlement state machine. Designed for extension with LLM providers.
 */
@Injectable()
export class DvpAgentService {
  private readonly logger = new Logger(DvpAgentService.name);

  constructor(
    private readonly mletrDocumentService: MletrDocumentService,
    private readonly stablecoinPaymentService: StablecoinPaymentService,
  ) {}

  /**
   * Primary agent orchestration entry point.
   * Evaluates settlement state and returns recommended actions.
   */
  orchestrate(
    settlement: DvpSettlementDto,
    tradeDocument: {
      documentType: string;
      documentContent?: Record<string, unknown>;
      status: string;
      issueDetails?: {
        documentClass?: string;
        merkleRoot?: string;
        transactionHash?: string;
      };
    },
  ): AgentOrchestrationResult {
    const decisions: AgentOrchestrationResult['decisions'] = [];
    const complianceNotes: string[] = [];

    // Tool 1: Validate mLETR compliance
    const mletrResult = this.toolValidateMletrCompliance(
      tradeDocument,
      settlement.mletrAttributes.governingLaw,
    );
    decisions.push({
      action: AgentAction.VALIDATE_MLETR_COMPLIANCE,
      reasoning: mletrResult.compliant
        ? 'Document meets mLETR electronic transferable record requirements'
        : `Compliance gaps: ${mletrResult.notes.join('; ')}`,
      confidence: mletrResult.compliant ? 0.95 : 0.6,
    });
    complianceNotes.push(...mletrResult.notes);

    if (!mletrResult.compliant) {
      return {
        recommendedStatus: DvpSettlementStatus.FAILED,
        nextActions: [AgentAction.REJECT_SETTLEMENT],
        decisions,
        compliant: false,
        complianceNotes,
      };
    }

    // Tool 2: Extract settlement terms from AI-parsed document content
    const terms = this.toolExtractSettlementTerms(
      tradeDocument.documentType,
      tradeDocument.documentContent,
      settlement,
    );
    decisions.push({
      action: AgentAction.EXTRACT_SETTLEMENT_TERMS,
      reasoning: terms
        ? `Extracted settlement: ${terms.amount} ${terms.currency} between ${terms.sellerParty} and ${terms.buyerParty}`
        : 'Using manually configured settlement terms',
      confidence: terms ? 0.9 : 0.7,
    });

    // Tool 3: Determine next action based on current status
    return this.determineNextActions(settlement, terms, decisions, complianceNotes);
  }

  orchestratePaymentConfirmation(
    settlement: DvpSettlementDto,
    verificationResult: { verified: boolean; message: string },
  ): AgentOrchestrationResult {
    const decisions: AgentOrchestrationResult['decisions'] = [];

    if (verificationResult.verified) {
      decisions.push({
        action: AgentAction.CONFIRM_PAYMENT,
        reasoning: verificationResult.message,
        confidence: 0.98,
      });
      return {
        recommendedStatus: DvpSettlementStatus.PAYMENT_CONFIRMED,
        nextActions: [AgentAction.TRANSFER_DOCUMENT],
        decisions,
        compliant: true,
        complianceNotes: ['Payment verified in escrow — proceeding to document transfer (DvP)'],
      };
    }

    decisions.push({
      action: AgentAction.REQUEST_PAYMENT,
      reasoning: verificationResult.message,
      confidence: 0.85,
    });
    return {
      recommendedStatus: DvpSettlementStatus.AWAITING_PAYMENT,
      nextActions: [AgentAction.REQUEST_PAYMENT],
      decisions,
      compliant: true,
      complianceNotes: ['Payment not yet confirmed — awaiting buyer deposit to escrow'],
    };
  }

  private toolValidateMletrCompliance(
    tradeDocument: {
      documentType: string;
      documentContent?: Record<string, unknown>;
      status: string;
      issueDetails?: { documentClass?: string; merkleRoot?: string; transactionHash?: string };
    },
    governingLaw?: string,
  ) {
    return this.mletrDocumentService.validateForMletr(
      tradeDocument.documentType,
      tradeDocument.documentContent,
      tradeDocument.issueDetails as any,
      tradeDocument.status,
      governingLaw,
    );
  }

  private toolExtractSettlementTerms(
    documentType: string,
    documentContent: Record<string, unknown> | undefined,
    settlement: DvpSettlementDto,
  ): SettlementTerms | undefined {
    const extracted = this.mletrDocumentService.extractSettlementAmount(
      documentType,
      documentContent,
    );

    const amount = settlement.payment.amount;
    const decimals = settlement.payment.decimals;

    if (extracted) {
      return {
        amount: extracted.amount,
        amountAtomic: this.stablecoinPaymentService.parseAmountToAtomic(
          extracted.amount,
          decimals,
        ),
        currency: extracted.currency,
        sellerParty: settlement.mletrAttributes.sellerParty ?? 'Unknown',
        buyerParty: settlement.mletrAttributes.buyerParty ?? 'Unknown',
        documentReference: settlement.mletrAttributes.documentReference ?? '',
      };
    }

    return {
      amount,
      amountAtomic: settlement.payment.amountAtomic,
      currency: settlement.payment.stablecoin,
      sellerParty: settlement.mletrAttributes.sellerParty ?? 'Unknown',
      buyerParty: settlement.mletrAttributes.buyerParty ?? 'Unknown',
      documentReference: settlement.mletrAttributes.documentReference ?? '',
    };
  }

  private determineNextActions(
    settlement: DvpSettlementDto,
    terms: SettlementTerms | undefined,
    decisions: AgentOrchestrationResult['decisions'],
    complianceNotes: string[],
  ): AgentOrchestrationResult {
    switch (settlement.status) {
      case DvpSettlementStatus.DRAFT:
      case DvpSettlementStatus.PENDING_AGENT_REVIEW:
        decisions.push({
          action: AgentAction.REQUEST_PAYMENT,
          reasoning: 'Agent validated document — buyer should deposit stablecoin to escrow wallet',
          confidence: 0.92,
        });
        return {
          recommendedStatus: DvpSettlementStatus.AWAITING_PAYMENT,
          nextActions: [AgentAction.REQUEST_PAYMENT],
          settlementTerms: terms,
          decisions,
          compliant: true,
          complianceNotes,
        };

      case DvpSettlementStatus.AWAITING_PAYMENT:
        decisions.push({
          action: AgentAction.CONFIRM_PAYMENT,
          reasoning: 'Awaiting on-chain payment confirmation to escrow',
          confidence: 0.8,
        });
        return {
          recommendedStatus: DvpSettlementStatus.AWAITING_PAYMENT,
          nextActions: [AgentAction.CONFIRM_PAYMENT],
          settlementTerms: terms,
          decisions,
          compliant: true,
          complianceNotes: [...complianceNotes, 'DvP: document transfer blocked until payment confirmed'],
        };

      case DvpSettlementStatus.PAYMENT_CONFIRMED:
        decisions.push({
          action: AgentAction.TRANSFER_DOCUMENT,
          reasoning: 'Payment confirmed — executing simultaneous document title transfer (DvP delivery leg)',
          confidence: 0.95,
        });
        return {
          recommendedStatus: DvpSettlementStatus.DOCUMENT_TRANSFER_IN_PROGRESS,
          nextActions: [AgentAction.TRANSFER_DOCUMENT, AgentAction.RELEASE_FUNDS],
          settlementTerms: terms,
          decisions,
          compliant: true,
          complianceNotes,
        };

      case DvpSettlementStatus.DOCUMENT_TRANSFER_IN_PROGRESS:
      case DvpSettlementStatus.PAYMENT_RELEASED:
        decisions.push({
          action: AgentAction.COMPLETE_SETTLEMENT,
          reasoning: 'Both DvP legs complete — finalising settlement',
          confidence: 0.99,
        });
        return {
          recommendedStatus: DvpSettlementStatus.SETTLED,
          nextActions: [AgentAction.COMPLETE_SETTLEMENT],
          settlementTerms: terms,
          decisions,
          compliant: true,
          complianceNotes,
        };

      default:
        return {
          recommendedStatus: settlement.status,
          nextActions: [],
          settlementTerms: terms,
          decisions,
          compliant: true,
          complianceNotes,
        };
    }
  }
}
