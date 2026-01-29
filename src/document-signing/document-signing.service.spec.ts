import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken, getFlowProducerToken } from '@nestjs/bullmq';
import { DocumentSigningService } from './document-signing.service';
import { DocumentSigningRepository } from './document-signing.repository';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import { SIGN_DOCUMENT_ON_BEHALF_QUEUE } from '../constants/app.constants';

describe('DocumentSigningService', () => {
  let service: DocumentSigningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentSigningService,
        {
          provide: DocumentSigningRepository,
          useValue: {},
        },
        {
          provide: TradeDocumentsService,
          useValue: {},
        },
        {
          provide: getQueueToken(SIGN_DOCUMENT_ON_BEHALF_QUEUE),
          useValue: { add: jest.fn() },
        },
        {
          provide: getFlowProducerToken('create-signing-event'),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DocumentSigningService>(DocumentSigningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
