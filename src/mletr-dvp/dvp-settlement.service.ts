import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { DvpSettlementRepository } from './dvp-settlement.repository';
import { CreateDvpSettlementDto, DvpSettlementDto, PaymentInstructionsDto } from './dtos/dvp-settlement.dto';
import { StablecoinPaymentService } from './services/stablecoin-payment.service';
import { MletrDocumentService } from './services/mletr-document.service';
import { DvpCoordinatorService } from './services/dvp-coordinator.service';
import { DvpAgentService } from './services/dvp-agent.service';
import { TradeDocumentsRepository } from '../trade-documents/trade-documents.repository';
import { AccountsService } from '../accounts/accounts.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';
import { DvpSettlementStatus, StablecoinType } from './types/dvp-settlement.types';
import { DvpSettlementEvent, DvpSettlementQueues } from '../constants/app.constants';
import { SearchQueryDto } from '../common/dtos/search.dto';
import { plainToInstance } from 'class-transformer';
import { TradeDocumentStatus } from '../types/trade-documents.types';
import { AgentOrchestrationResponseDto } from './dtos/dvp-settlement.dto';

@Injectable()
export class DvpSettlementService {
  private readonly logger = new Logger(DvpSettlementService.name);

  constructor(
    private readonly settlementRepository: DvpSettlementRepository,
    private readonly paymentService: StablecoinPaymentService,
    private readonly mletrDocumentService: MletrDocumentService,
    private readonly coordinatorService: DvpCoordinatorService,
    private readonly agentService: DvpAgentService,
    private readonly tradeDocumentsRepository: TradeDocumentsRepository,
    private readonly accountsService: AccountsService,
    private readonly auditService: AuditService,
    @InjectQueue(DvpSettlementQueues.SETTLEMENT_QUEUE)
    private readonly settlementQueue: Queue,
  ) {}

  async createSettlement(
    accountId: string,
    dto: CreateDvpSettlementDto,
  ): Promise<DvpSettlementDto> {
    if (!(await this.accountsService.accountExists(accountId))) {
      throw new NotFoundException('Account not found');
    }

    const tradeDocument = await this.tradeDocumentsRepository.getDocumentById(
      accountId,
      dto.tradeDocumentId,
    );

    if (tradeDocument.status !== TradeDocumentStatus.ISSUED) {
      throw new BadRequestException('Only issued trade documents can be settled via DvP');
    }

    const existing = await this.settlementRepository.findByDocumentId(
      accountId,
      dto.tradeDocumentId,
    );
    if (existing) {
      throw new BadRequestException(
        `Active DvP settlement already exists for document ${dto.tradeDocumentId}`,
      );
    }

    const stablecoin = dto.stablecoin ?? StablecoinType.USDC;
    const tokenAddress = this.paymentService.getTokenContractAddress(stablecoin);
    const decimals = this.paymentService.getTokenDecimals(stablecoin);
    const escrowAddress = this.paymentService.getEscrowWalletAddress();

    if (!tokenAddress || !escrowAddress) {
      throw new BadRequestException(
        'Stablecoin and escrow wallet must be configured for DvP settlement',
      );
    }

    const extractedAmount = this.mletrDocumentService.extractSettlementAmount(
      tradeDocument.documentType,
      tradeDocument.documentContent,
    );
    const amount = dto.amount ?? extractedAmount?.amount;
    if (!amount) {
      throw new BadRequestException(
        'Settlement amount required — provide manually or ensure document has AI-parsed content',
      );
    }

    const mletrValidation = this.mletrDocumentService.validateForMletr(
      tradeDocument.documentType,
      tradeDocument.documentContent,
      tradeDocument.issueDetails,
      tradeDocument.status,
      dto.governingLaw,
    );

    const settlementReference = `DVP-${uuidv4().slice(0, 8).toUpperCase()}`;
    const amountAtomic = this.paymentService.parseAmountToAtomic(amount, decimals);

    const settlement = await this.settlementRepository.create({
      accountId,
      settlementReference,
      status: DvpSettlementStatus.DRAFT,
      document: {
        tradeDocumentId: dto.tradeDocumentId,
        documentType: tradeDocument.documentType,
        merkleRoot: tradeDocument.issueDetails?.merkleRoot,
        tokenId: tradeDocument.issueDetails?.merkleRoot,
        beneficiaryAddress: tradeDocument.claimants?.beneficiary?.walletAddress,
        holderAddress: tradeDocument.claimants?.owner?.walletAddress,
      },
      payment: {
        stablecoin,
        amount,
        amountAtomic,
        tokenContractAddress: tokenAddress,
        decimals,
        buyerWalletAddress: dto.buyerWalletAddress,
        sellerWalletAddress: dto.sellerWalletAddress,
        escrowWalletAddress: escrowAddress,
      },
      mletrAttributes: mletrValidation.attributes,
      agentDecisions: [],
    });

    await this.auditService.log({
      subject: AuditSubject.DVP_SETTLEMENT,
      eventType: AuditEventType.DVP_SETTLEMENT_CREATED,
      identifier: settlement.id,
      accountId,
      details: { settlementReference, tradeDocumentId: dto.tradeDocumentId },
    });

    return settlement;
  }

  async initiateSettlement(
    accountId: string,
    settlementId: string,
  ): Promise<AgentOrchestrationResponseDto> {
    await this.settlementRepository.updateStatus(
      accountId,
      settlementId,
      DvpSettlementStatus.PENDING_AGENT_REVIEW,
    );

    await this.settlementQueue.add(DvpSettlementEvent.AGENT_REVIEW, {
      accountId,
      settlementId,
    });

    const settlement = await this.coordinatorService.runAgentReview(accountId, settlementId);
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

    return plainToInstance(
      AgentOrchestrationResponseDto,
      {
        settlementId: settlement.id,
        status: settlement.status,
        compliant: orchestration.compliant,
        nextActions: orchestration.nextActions,
        complianceNotes: orchestration.complianceNotes,
        decisions: settlement.agentDecisions.slice(-orchestration.decisions.length),
      },
      { excludeExtraneousValues: true },
    );
  }

  async getPaymentInstructions(
    accountId: string,
    settlementId: string,
  ): Promise<PaymentInstructionsDto> {
    const settlement = await this.settlementRepository.findById(accountId, settlementId);

    return plainToInstance(
      PaymentInstructionsDto,
      {
        escrowWalletAddress: settlement.payment.escrowWalletAddress,
        tokenContractAddress: settlement.payment.tokenContractAddress,
        amount: settlement.payment.amount,
        amountAtomic: settlement.payment.amountAtomic,
        stablecoin: settlement.payment.stablecoin,
        settlementReference: settlement.settlementReference,
      },
      { excludeExtraneousValues: true },
    );
  }

  async confirmPayment(
    accountId: string,
    settlementId: string,
    paymentTxHash: string,
  ): Promise<DvpSettlementDto> {
    const result = await this.coordinatorService.confirmPayment(
      accountId,
      settlementId,
      paymentTxHash,
    );

    if (result.status === DvpSettlementStatus.PAYMENT_CONFIRMED) {
      await this.settlementQueue.add(DvpSettlementEvent.EXECUTE_DOCUMENT_TRANSFER, {
        accountId,
        settlementId,
      });
    }

    return result;
  }

  async executeSettlement(
    accountId: string,
    settlementId: string,
  ): Promise<DvpSettlementDto> {
    await this.settlementQueue.add(DvpSettlementEvent.COMPLETE_SETTLEMENT, {
      accountId,
      settlementId,
    });

    const settlement = await this.coordinatorService.executeDocumentTransfer(
      accountId,
      settlementId,
    );
    await this.coordinatorService.releasePayment(accountId, settlementId);
    return this.coordinatorService.completeSettlement(accountId, settlementId);
  }

  async getSettlement(accountId: string, settlementId: string): Promise<DvpSettlementDto> {
    return this.settlementRepository.findById(accountId, settlementId);
  }

  async listSettlements(
    accountId: string,
    searchParams: SearchQueryDto,
  ): Promise<{ metadata: Record<string, number>; data: DvpSettlementDto[] }> {
    return this.settlementRepository.listByAccount(accountId, searchParams);
  }

  async cancelSettlement(accountId: string, settlementId: string): Promise<DvpSettlementDto> {
    const settlement = await this.settlementRepository.findById(accountId, settlementId);

    if (
      [DvpSettlementStatus.SETTLED, DvpSettlementStatus.CANCELLED].includes(settlement.status)
    ) {
      throw new BadRequestException(`Cannot cancel settlement in status ${settlement.status}`);
    }

    const cancelled = await this.settlementRepository.updateStatus(
      accountId,
      settlementId,
      DvpSettlementStatus.CANCELLED,
    );

    await this.auditService.log({
      subject: AuditSubject.DVP_SETTLEMENT,
      eventType: AuditEventType.DVP_SETTLEMENT_CANCELLED,
      identifier: settlementId,
      accountId,
    });

    return cancelled;
  }
}
