import { Test, TestingModule } from '@nestjs/testing';
import { DealDeskController } from './deal-desk.controller';

describe('DealDeskController', () => {
  let controller: DealDeskController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DealDeskController],
    }).compile();

    controller = module.get<DealDeskController>(DealDeskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
