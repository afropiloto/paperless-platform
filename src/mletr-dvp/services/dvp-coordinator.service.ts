import { Injectable, Logger } from '@nestjs/common';
import { DvpSettlementRepository } from '../dvp-settlement.repository';
import { DvpAgentService } from './dvp-agent.service';
import { StablecoinPaymentService } from './stablecoin-payment.service';
import { MletrDocumentService } from './mletr-document.service';
import { TradeTrustService } from '../../trade-trust/trade-trust.service';
import { TradeDocumentsRepository } from '../../trade-documents/trade-documents.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditEventType, AuditSubject } from '../../audit/audit-event-type.enum';
import { DvpSettlementStatus } from '../types/dvp-settlement.types';
import { DvpSettlementDto } from '../dtos/dvp-settlement.dto';
import { TradeTrustDocumentClass } from '../../trade-trust/trade-trust.types';

@Injectable()
export class DvpCoordinatorService {
  private readonly logger = new Logger(DvpCoordinatorService.name);

  constructor(
    private readonly settlementRepository: DvpSettlementRepository,
    private readonly agentService: DvpAgentService,
    private readonly paymentService: StablecoinPaymentService,
    private readonly mletrDocumentService: MletrDocumentService,
    private readonly tradeTrustService: TradeTrustService,
    private readonly tradeDocumentsRepository: TradeDocumentsRepository,
    private readonly auditService: AuditService,
  ) {}

  async runAgentReview(
    accountId: string,
    settlementId: string,
  ): Promise<DvpSettlementDto> {
    const settlement = await this.settlementRepository.findById(accountId, settlementId);
    const tradeDocument = await this.tradeDocumentsRepository.getDocumentById(
      accountId,
      settlement.document.tradeDocumentId,
    );

    const orchestration = this.agentService.orchestrate(settlement, {
      documentType: tradeDocument.documentType,
      documentContent: tradeDocument.documentContent,
      status: tradeDocument.status,
      issueDetails: tradeDocument.issueDetails,
    });

    for (const decision of orchestration.decisions) {
      await this.settlementRepository.appendAgentDecision(accountId, settlementId, {
        timestamp: new Date(),
        action: decision.action,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
      });
    }

    if (!orchestration.compliant) {
      return this.settlementRepository.updateStatus(
        accountId,
        settlementId,
        DvpSettlementStatus.FAILED,
        { failureReason: orchestration.complianceNotes.join('; ') },
      );
    }

    // Update payment amount if agent extracted terms from parsed document
    if (orchestration.settlementTerms) {
      await this.settlementRepository.updatePayment(accountId, settlementId, {
        amount: orchestration.settlementTerms.amount,
        amountAtomic: orchestration.settlementTerms.amountAtomic,
      });
    }

    const updated = await this.settlementRepository.updateStatus(
      accountId,
      settlementId,
      orchestration.recommendedStatus,
    );

    await this.auditService.log({
      subject: AuditSubject.DVP_SETTLEMENT,
      eventType: AuditEventType.DVP_AGENT_REVIEW_COMPLETED,
      identifier: settlementId,
      accountId,
      details: {
        nextActions: orchestration.nextActions,
        compliant: orchestration.compliant,
      },
    });

    return updated;
  }

  async confirmPayment(
    accountId: string,
    settlementId: string,
    paymentTxHash: string,
  ): Promise<DvpSettlementDto> {
    const settlement = await this.settlementRepository.findById(accountId, settlementId);

    if (
      settlement.status !== DvpSettlementStatus.AWAITING_PAYMENT &&
      settlement.status !== DvpSettlementStatus.PAYMENT_CONFIRMED
    ) {
      throw new Error(`Cannot confirm payment in status ${settlement.status}`);
    }

    const verification = await this.paymentService.verifyPaymentToEscrow(
      paymentTxHash,
      settlement.payment.amountAtomic,
      settlement.payment.tokenContractAddress,
      settlement.payment.escrowWalletAddress,
    );

    const orchestration = this.agentService.orchestratePaymentConfirmation(
      settlement,
      verification,
    );

    for (const decision of orchestration.decisions) {
      await this.settlementRepository.appendAgentDecision(accountId, settlementId, {
        timestamp: new Date(),
        action: decision.action,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
      });
    }

    if (!verification.verified) {
      await this.auditService.log({
        subject: AuditSubject.DVP_SETTLEMENT,
        eventType: AuditEventType.DVP_PAYMENT_VERIFICATION_FAILED,
        identifier: settlementId,
        accountId,
        details: { paymentTxHash, message: verification.message },
      });
      return settlement;
    }

    await this.settlementRepository.updatePayment(accountId, settlementId, {
      paymentTxHash,
    });

    const updated = await this.settlementRepository.updateStatus(
      accountId,
      settlementId,
      DvpSettlementStatus.PAYMENT_CONFIRMED,
    );

    await this.auditService.log({
      subject: AuditSubject.DVP_SETTLEMENT,
      eventType: AuditEventType.DVP_PAYMENT_CONFIRMED,
      identifier: settlementId,
      accountId,
      details: { paymentTxHash, amount: verification.amountReceived },
    });

    return updated;
  }

  async executeDocumentTransfer(
    accountId: string,
    settlementId: string,
  ): Promise<DvpSettlementDto> {
    const settlement = await this.settlementRepository.findById(accountId, settlementId);

    if (settlement.status !== DvpSettlementStatus.PAYMENT_CONFIRMED) {
      throw new Error(`Document transfer requires PAYMENT_CONFIRMED status, got ${settlement.status}`);
    }

    await this.settlementRepository.updateStatus(
      accountId,
      settlementId,
      DvpSettlementStatus.DOCUMENT_TRANSFER_IN_PROGRESS,
    );

    const tradeDocument = await this.tradeDocumentsRepository.getDocumentById(
      accountId,
      settlement.document.tradeDocumentId,
    );

    let transferTxHash: string | undefined;

    if (
      tradeDocument.issueDetails?.documentClass === TradeTrustDocumentClass.TRANSFERABLE &&
      tradeDocument.issueDetails?.merkleRoot
    ) {
      const result = await this.tradeTrustService.transferHolder(
        tradeDocument.issueDetails.merkleRoot,
        settlement.payment.buyerWalletAddress,
      );
      transferTxHash = result.transactionHash;

      await this.settlementRepository.updateDocument(accountId, settlementId, {
        transferTxHash,
        holderAddress: settlement.payment.buyerWalletAddress,
      });
    }

    await this.auditService.log({
      subject: AuditSubject.DVP_SETTLEMENT,
      eventType: AuditEventType.DVP_DOCUMENT_TRANSFERRED,
      identifier: settlementId,
      accountId,
      details: { transferTxHash, buyerWallet: settlement.payment.buyerWalletAddress },
    });

    return this.settlementRepository.updateStatus(
      accountId,
      settlementId,
      DvpSettlementStatus.DOCUMENT_TRANSFER_IN_PROGRESS,
    );
  }

  async releasePayment(
    accountId: string,
    settlementId: string,
  ): Promise<DvpSettlementDto> {
    const settlement = await this.settlementRepository.findById(accountId, settlementId);

    if (
      settlement.status !== DvpSettlementStatus.DOCUMENT_TRANSFER_IN_PROGRESS &&
      settlement.status !== DvpSettlementStatus.PAYMENT_CONFIRMED
    ) {
      throw new Error(`Cannot release payment in status ${settlement.status}`);
    }

    const { txHash } = await this.paymentService.releasePaymentToSeller(
      settlement.payment.tokenContractAddress,
      settlement.payment.sellerWalletAddress,
      settlement.payment.amountAtomic,
    );

    await this.settlementRepository.updatePayment(accountId, settlementId, {
      releaseTxHash: txHash,
    });

    await this.auditService.log({
      subject: AuditSubject.DVP_SETTLEMENT,
      eventType: AuditEventType.DVP_PAYMENT_RELEASED,
      identifier: settlementId,
      accountId,
      details: { releaseTxHash: txHash, sellerWallet: settlement.payment.sellerWalletAddress },
    });

    return this.settlementRepository.updateStatus(
      accountId,
      settlementId,
      DvpSettlementStatus.PAYMENT_RELEASED,
    );
  }

  async completeSettlement(
    accountId: string,
    settlementId: string,
  ): Promise<DvpSettlementDto> {
    const settlement = await this.settlementRepository.updateStatus(
      accountId,
      settlementId,
      DvpSettlementStatus.SETTLED,
      { settledAt: new Date() },
    );

    await this.auditService.log({
      subject: AuditSubject.DVP_SETTLEMENT,
      eventType: AuditEventType.DVP_SETTLEMENT_COMPLETED,
      identifier: settlementId,
      accountId,
      details: {
        paymentTxHash: settlement.payment.paymentTxHash,
        releaseTxHash: settlement.payment.releaseTxHash,
        transferTxHash: settlement.document.transferTxHash,
      },
    });

    this.logger.log({
      message: 'DvP settlement completed',
      settlementId,
      reference: settlement.settlementReference,
    });

    return settlement;
  }

  async executeFullDvpFlow(
    accountId: string,
    settlementId: string,
    paymentTxHash?: string,
  ): Promise<DvpSettlementDto> {
    let settlement = await this.runAgentReview(accountId, settlementId);

    if (settlement.status === DvpSettlementStatus.FAILED) {
      return settlement;
    }

    if (paymentTxHash) {
      settlement = await this.confirmPayment(accountId, settlementId, paymentTxHash);
      if (settlement.status !== DvpSettlementStatus.PAYMENT_CONFIRMED) {
        return settlement;
      }
    } else if (settlement.status === DvpSettlementStatus.AWAITING_PAYMENT) {
      return settlement;
    }

    settlement = await this.executeDocumentTransfer(accountId, settlementId);
    settlement = await this.releasePayment(accountId, settlementId);
    return this.completeSettlement(accountId, settlementId);
  }
}
