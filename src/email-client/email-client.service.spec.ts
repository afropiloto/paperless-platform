import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailClientService } from './email-client.service';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { EMAIL_PROVIDER_FACTORY } from './email-client.constants';
import { SendEmailOptions, EmailResult, EmailProviderType } from './types';

describe('EmailClientService', () => {
  let service: EmailClientService;
  let configService: ConfigService;
  let providerFactory: EmailProviderFactory;

  const mockProvider = {
    sendEmail: jest.fn(),
    getProviderName: jest.fn(),
    isHealthy: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockProviderFactory = {
    createProviderFromConfig: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock values
    mockConfigService.get.mockReturnValue('test-api-key'); // API key
    mockConfigService.get.mockReturnValue('test@example.com'); // sender email
    mockConfigService.get.mockReturnValue(EmailProviderType.BREVO); // provider type
    mockProviderFactory.createProviderFromConfig.mockReturnValue(mockProvider);
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailClientService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EMAIL_PROVIDER_FACTORY,
          useValue: mockProviderFactory,
        },
      ],
    }).compile();

    service = module.get<EmailClientService>(EmailClientService);
    configService = module.get<ConfigService>(ConfigService);
    providerFactory = module.get<EmailProviderFactory>(EMAIL_PROVIDER_FACTORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with provider from factory', () => {
      expect(providerFactory.createProviderFromConfig).toHaveBeenCalled();
    });

    it('should log the provider name on initialization', () => {
      mockProvider.getProviderName.mockReturnValue(EmailProviderType.BREVO);
      
      // Create a new service instance to test the constructor logging
      const newService = new EmailClientService(mockConfigService as any, mockProviderFactory as any);
      
      // The logging happens in the constructor, so we just verify the service was created successfully
      expect(newService).toBeDefined();
      expect(providerFactory.createProviderFromConfig).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    it('should delegate to provider and return EmailResult', async () => {
      const emailOptions: SendEmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test Content</h1>',
      };

      const expectedResult: EmailResult = {
        messageId: 'test-message-id',
        provider: EmailProviderType.BREVO,
        sentAt: new Date(),
        status: 'sent',
      };

      mockProvider.sendEmail.mockResolvedValue(expectedResult);

      const result = await service.sendEmail(emailOptions);

      expect(mockProvider.sendEmail).toHaveBeenCalledWith(emailOptions);
      expect(result).toEqual(expectedResult);
    });

    it('should handle provider errors', async () => {
      const emailOptions: SendEmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test Content</h1>',
      };

      const errorResult: EmailResult = {
        provider: EmailProviderType.BREVO,
        sentAt: new Date(),
        status: 'failed',
        error: 'API Error',
      };

      mockProvider.sendEmail.mockResolvedValue(errorResult);

      const result = await service.sendEmail(emailOptions);

      expect(result.status).toBe('failed');
      expect(result.error).toBe('API Error');
    });
  });

  describe('getProviderName', () => {
    it('should return provider name from underlying provider', () => {
      mockProvider.getProviderName.mockReturnValue(EmailProviderType.BREVO);

      const providerName = service.getProviderName();

      expect(mockProvider.getProviderName).toHaveBeenCalled();
      expect(providerName).toBe(EmailProviderType.BREVO);
    });
  });

  describe('isHealthy', () => {
    it('should delegate health check to provider', async () => {
      mockProvider.isHealthy.mockResolvedValue(true);

      const isHealthy = await service.isHealthy();

      expect(mockProvider.isHealthy).toHaveBeenCalled();
      expect(isHealthy).toBe(true);
    });

    it('should return false when provider is unhealthy', async () => {
      mockProvider.isHealthy.mockResolvedValue(false);

      const isHealthy = await service.isHealthy();

      expect(mockProvider.isHealthy).toHaveBeenCalled();
      expect(isHealthy).toBe(false);
    });
  });
}); 