import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { TradeFinanceService } from './trade-finance.service';
import { TradeFinanceRepository } from './trade-finance.repository';
import { DealDeskQueues } from '../constants/app.constants';

describe('TradeFinanceService', () => {
  let service: TradeFinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeFinanceService,
        {
          provide: TradeFinanceRepository,
          useValue: {
            getAvailableFinanceableInvoiceDocuments: jest.fn(),
            createTradeFinanceDeal: jest.fn(),
            getTradeFinanceDealById: jest.fn(),
            updateTradeFinanceDealStatus: jest.fn(),
            searchTradeFinanceDeals: jest.fn(),
          },
        },
        {
          provide: getQueueToken(DealDeskQueues.CUSTOMER_FUNDING_REQUESTS),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TradeFinanceService>(TradeFinanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
