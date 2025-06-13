import { Test, TestingModule } from '@nestjs/testing';
import { TradeFinanceService } from './trade-finance.service';

describe('TradeFinanceService', () => {
  let service: TradeFinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TradeFinanceService],
    }).compile();

    service = module.get<TradeFinanceService>(TradeFinanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
