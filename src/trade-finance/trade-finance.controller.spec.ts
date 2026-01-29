import { Test, TestingModule } from '@nestjs/testing';
import { TradeFinanceController } from './trade-finance.controller';
import { TradeFinanceService } from './trade-finance.service';
import { JwtGuard } from '../auth/guards/jwt-guard';
import { ApiKeyGuard } from '../api-key-auth/api-key.guard';

describe('TradeFinanceController', () => {
  let controller: TradeFinanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TradeFinanceController],
      providers: [
        {
          provide: TradeFinanceService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TradeFinanceController>(TradeFinanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
