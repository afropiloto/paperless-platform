import { Test, TestingModule } from '@nestjs/testing';
import { ShareLinksService } from './share-links.service';
import { ShareLinksRepository } from './share-links.repository';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import { AuditService } from '../audit/audit.service';

describe('ShareLinksService', () => {
  let service: ShareLinksService;
  let repository: ShareLinksRepository;
  let tradeDocumentsService: TradeDocumentsService;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareLinksService,
        {
          provide: ShareLinksRepository,
          useValue: {
            createShareLink: jest.fn(),
            findByLinkId: jest.fn(),
            updateAccessCount: jest.fn(),
            markAsExpired: jest.fn(),
            deleteShareLink: jest.fn(),
            findByAccountAndDocument: jest.fn(),
          },
        },
        {
          provide: TradeDocumentsService,
          useValue: {
            getDocumentById: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ShareLinksService>(ShareLinksService);
    repository = module.get<ShareLinksRepository>(ShareLinksRepository);
    tradeDocumentsService = module.get<TradeDocumentsService>(TradeDocumentsService);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createShareLink', () => {
    it('should create a share link successfully', async () => {
      const mockDocument = { id: 'doc123', accountId: 'acc123' };
      const mockShareLink = {
        linkId: 'test-link-id',
        accountId: 'acc123',
        documentId: 'doc123',
        encryptedData: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        expiresAt: new Date(),
        allowedEmails: ['test@example.com'],
        createdBy: 'user123',
        isExpired: false,
        accessCount: 0,
      };

      jest.spyOn(tradeDocumentsService, 'getDocumentById').mockResolvedValue(mockDocument as any);
      jest.spyOn(repository, 'createShareLink').mockResolvedValue(mockShareLink as any);
      jest.spyOn(auditService, 'log').mockResolvedValue();

      const result = await service.createShareLink(
        'acc123',
        'doc123',
        { expiresAt: new Date(), allowedEmails: ['test@example.com'] },
        'user123',
      );

      expect(result.linkId).toBeDefined();
      expect(tradeDocumentsService.getDocumentById).toHaveBeenCalledWith('acc123', 'doc123');
      expect(repository.createShareLink).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('accessShareLink', () => {
    it('should access a share link successfully', async () => {
      const mockShareLink = {
        linkId: 'test-link-id',
        accountId: 'acc123',
        documentId: 'doc123',
        encryptedData: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        allowedEmails: [],
        isExpired: false,
        accessCount: 0,
        accessHistory: [],
      };

      const mockDocument = { id: 'doc123', accountId: 'acc123' };

      jest.spyOn(repository, 'findByLinkId').mockResolvedValue(mockShareLink as any);
      jest.spyOn(repository, 'updateAccessCount').mockResolvedValue();
      jest.spyOn(tradeDocumentsService, 'getDocumentById').mockResolvedValue(mockDocument as any);
      jest.spyOn(auditService, 'log').mockResolvedValue();

      const result = await service.accessShareLink('test-link-id');

      expect(result).toEqual(mockDocument);
      expect(repository.updateAccessCount).toHaveBeenCalledWith('test-link-id', undefined);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should track email access when provided', async () => {
      const mockShareLink = {
        linkId: 'test-link-id',
        accountId: 'acc123',
        documentId: 'doc123',
        encryptedData: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        expiresAt: new Date(Date.now() + 86400000),
        allowedEmails: ['test@example.com'],
        isExpired: false,
        accessCount: 0,
        accessHistory: [],
      };

      const mockDocument = { id: 'doc123', accountId: 'acc123' };

      jest.spyOn(repository, 'findByLinkId').mockResolvedValue(mockShareLink as any);
      jest.spyOn(repository, 'updateAccessCount').mockResolvedValue();
      jest.spyOn(tradeDocumentsService, 'getDocumentById').mockResolvedValue(mockDocument as any);
      jest.spyOn(auditService, 'log').mockResolvedValue();

      const result = await service.accessShareLink('test-link-id', 'test@example.com');

      expect(result).toEqual(mockDocument);
      expect(repository.updateAccessCount).toHaveBeenCalledWith('test-link-id', 'test@example.com');
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('getShareLinkDetails', () => {
    it('should return share link details with access history', async () => {
      const mockShareLink = {
        linkId: 'test-link-id',
        accountId: 'acc123',
        documentId: 'doc123',
        encryptedData: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        expiresAt: new Date(),
        allowedEmails: ['test@example.com'],
        createdBy: 'user123',
        isExpired: false,
        accessCount: 2,
        lastAccessedAt: new Date(),
        accessHistory: [
          { email: 'test@example.com', accessedAt: new Date() },
          { email: 'another@example.com', accessedAt: new Date() },
        ],
      };

      jest.spyOn(repository, 'findByLinkId').mockResolvedValue(mockShareLink as any);

      const result = await service.getShareLinkDetails('test-link-id');

      expect(result.linkId).toBe('test-link-id');
      expect(result.accessCount).toBe(2);
      expect(result.accessHistory).toHaveLength(2);
      expect(result.accessHistory[0].email).toBe('test@example.com');
    });

    it('should throw NotFoundException for non-existent link', async () => {
      jest.spyOn(repository, 'findByLinkId').mockResolvedValue(null);

      await expect(service.getShareLinkDetails('non-existent')).rejects.toThrow('Share link not found');
    });
  });
}); 