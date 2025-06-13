import { Test, TestingModule } from '@nestjs/testing';
import { DealDeskService } from './deal-desk.service';

describe('DealDeskService', () => {
  let service: DealDeskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DealDeskService],
    }).compile();

    service = module.get<DealDeskService>(DealDeskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
