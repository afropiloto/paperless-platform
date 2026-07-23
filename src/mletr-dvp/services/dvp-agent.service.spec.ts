import { Test, TestingModule } from '@nestjs/testing';
import { DvpAgentService } from './dvp-agent.service';
import { MletrDocumentService } from './mletr-document.service';
import { StablecoinPaymentService } from './stablecoin-payment.service';
import { DvpSettlementStatus, StablecoinType } from '../types/dvp-settlement.types';
import { DvpSettlementDto } from '../dtos/dvp-settlement.dto';
import { TradeDocumentStatus, TradeDocumentType } from '../../types/trade-documents.types';
import { AgentAction } from '../types/dvp-agent.types';
import { TradeTrustDocumentClass } from '../../trade-trust/trade-trust.types';

describe('DvpAgentService', () => {
  let service: DvpAgentService;

  const mockPaymentService = {
    parseAmountToAtomic: jest.fn().mockReturnValue('1500000000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DvpAgentService,
        MletrDocumentService,
        { provide: StablecoinPaymentService, useValue: mockPaymentService },
      ],
    }).compile();

    service = module.get(DvpAgentService);
  });

  const baseSettlement: DvpSettlementDto = {
    id: 'settlement-1',
    accountId: 'account-1',
    settlementReference: 'DVP-TEST001',
    status: DvpSettlementStatus.DRAFT,
    document: {
      tradeDocumentId: 'doc-1',
      documentType: TradeDocumentType.BILL_OF_LADING,
    },
    payment: {
      stablecoin: StablecoinType.USDC,
      amount: '1500.00',
      amountAtomic: '1500000000',
      tokenContractAddress: '0xToken',
      decimals: 6,
      buyerWalletAddress: '0xBuyer',
      sellerWalletAddress: '0xSeller',
      escrowWalletAddress: '0xEscrow',
    },
    mletrAttributes: {
      isElectronicTransferableRecord: true,
      controlMethod: 'TOKEN_REGISTRY',
      documentReference: 'BL-12345',
      sellerParty: 'Shipper Co',
      buyerParty: 'Consignee Co',
    },
    agentDecisions: [],
  };

  it('should validate mLETR compliance and recommend payment request for issued transferable document', () => {
    const result = service.orchestrate(baseSettlement, {
      documentType: TradeDocumentType.BILL_OF_LADING,
      documentContent: {
        blNumber: 'BL-12345',
        consignor: { name: 'Shipper Co' },
        consignee: { name: 'Consignee Co' },
        freightCharges: { value: 1500, currency: 'USD' },
      },
      status: TradeDocumentStatus.ISSUED,
      issueDetails: {
        documentClass: TradeTrustDocumentClass.TRANSFERABLE as unknown as string,
        merkleRoot: '0xabc123',
        transactionHash: '0xtxhash',
      },
    });

    expect(result.compliant).toBe(true);
    expect(result.recommendedStatus).toBe(DvpSettlementStatus.AWAITING_PAYMENT);
    expect(result.nextActions).toContain(AgentAction.REQUEST_PAYMENT);
    expect(result.decisions.some((d) => d.action === AgentAction.VALIDATE_MLETR_COMPLIANCE)).toBe(true);
  });

  it('should reject non-compliant documents that are not issued', () => {
    const result = service.orchestrate(baseSettlement, {
      documentType: TradeDocumentType.BILL_OF_LADING,
      documentContent: {},
      status: TradeDocumentStatus.IN_PROGRESS,
      issueDetails: {},
    });

    expect(result.compliant).toBe(false);
    expect(result.recommendedStatus).toBe(DvpSettlementStatus.FAILED);
    expect(result.nextActions).toContain(AgentAction.REJECT_SETTLEMENT);
  });

  it('should confirm payment and recommend document transfer', () => {
    const result = service.orchestratePaymentConfirmation(
      { ...baseSettlement, status: DvpSettlementStatus.AWAITING_PAYMENT },
      { verified: true, message: 'Payment verified in escrow' },
    );

    expect(result.recommendedStatus).toBe(DvpSettlementStatus.PAYMENT_CONFIRMED);
    expect(result.nextActions).toContain(AgentAction.TRANSFER_DOCUMENT);
  });
});
