import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ClamAvVirusScanService } from './claimav-virus-scan.service';

describe('VirusScanService', () => {
  let service: ClamAvVirusScanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClamAvVirusScanService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => (key === 'VIRUS_SCANNER_HOST' ? 'localhost' : 3310)) },
        },
        {
          provide: getQueueToken('virus-scan'),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ClamAvVirusScanService>(ClamAvVirusScanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
