import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { TradeDocument } from '../trade-documents/schema/trade-document.schema';
import { TradeFinance } from '../trade-finance/schemas/trade-finance.schema';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import { TradeFinanceService } from '../trade-finance/trade-finance.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getModelToken(TradeDocument.name),
          useValue: {},
        },
        {
          provide: getModelToken(TradeFinance.name),
          useValue: {},
        },
        {
          provide: TradeDocumentsService,
          useValue: {},
        },
        {
          provide: TradeFinanceService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
}); 