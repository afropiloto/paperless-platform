import { Test, TestingModule } from '@nestjs/testing';
import { DocumentSigningService } from './document-signing.service';

describe('DocumentSigningService', () => {
  let service: DocumentSigningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentSigningService],
    }).compile();

    service = module.get<DocumentSigningService>(DocumentSigningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
