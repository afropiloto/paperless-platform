import { Test, TestingModule } from '@nestjs/testing';
import { TradeFinanceController } from './trade-finance.controller';

describe('TradeFinanceController', () => {
  let controller: TradeFinanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TradeFinanceController],
    }).compile();

    controller = module.get<TradeFinanceController>(TradeFinanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
