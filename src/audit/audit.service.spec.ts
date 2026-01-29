import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { AuditContextService } from './audit-context.service';
import { AuditRepository } from './audit.repository';

describe('AuditService', () => {
  let service: AuditService;
  let auditContextService: AuditContextService;
  let auditRepository: AuditRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: AuditContextService,
          useValue: {
            context: {
              clientLabel: 'test-client',
              userId: 'test-user-id',
              requestId: 'test-request-id',
            },
            runWithContext: jest.fn(),
          },
        },
        {
          provide: AuditRepository,
          useValue: {
            create: jest.fn(),
            findBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditContextService = module.get<AuditContextService>(AuditContextService);
    auditRepository = module.get<AuditRepository>(AuditRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
