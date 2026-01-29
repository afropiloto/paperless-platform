import { Test, TestingModule } from '@nestjs/testing';
import { SiweService } from './siwe.service';
import { NonceService } from './nonce.service';

describe('SiweService', () => {
  let service: SiweService;
  let nonceService: NonceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiweService,
        {
          provide: NonceService,
          useValue: {
            generateNonce: jest.fn(),
            verifyNonce: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SiweService>(SiweService);
    nonceService = module.get<NonceService>(NonceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
