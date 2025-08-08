import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailProviderFactory } from './email-provider.factory';
import { EmailProviderType } from '../types';

describe('EmailProviderFactory', () => {
  let factory: EmailProviderFactory;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProviderFactory,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    factory = module.get<EmailProviderFactory>(EmailProviderFactory);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('createProvider', () => {
    it('should create Brevo provider', () => {
      const mockConfig = {
        get: jest.fn()
          .mockReturnValueOnce('test-api-key') // EMAIL_SERVICE_API_KEY
          .mockReturnValueOnce('test@example.com'), // EMAIL_SERVICE_SENDER_EMAIL
      };

      const factoryWithConfig = new EmailProviderFactory(mockConfig as any);
      const provider = factoryWithConfig.createProvider(EmailProviderType.BREVO);

      expect(provider.getProviderName()).toBe(EmailProviderType.BREVO);
    });

    it('should create Dummy provider', () => {
      const provider = factory.createProvider(EmailProviderType.DUMMY);

      expect(provider.getProviderName()).toBe(EmailProviderType.DUMMY);
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        factory.createProvider('unsupported' as EmailProviderType);
      }).toThrow('Unsupported email provider: unsupported');
    });
  });

  describe('createProviderFromConfig', () => {
    it('should create provider based on config', () => {
      const mockConfig = {
        get: jest.fn()
          .mockReturnValueOnce(EmailProviderType.DUMMY) // EMAIL_PROVIDER_TYPE
          .mockReturnValueOnce('test-api-key') // EMAIL_SERVICE_API_KEY
          .mockReturnValueOnce('test@example.com'), // EMAIL_SERVICE_SENDER_EMAIL
      };

      const factoryWithConfig = new EmailProviderFactory(mockConfig as any);
      const provider = factoryWithConfig.createProviderFromConfig();

      expect(provider.getProviderName()).toBe(EmailProviderType.DUMMY);
    });

    it('should default to Brevo when no provider type specified', () => {
      const mockConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'EMAIL_PROVIDER_TYPE') {
            return defaultValue; // Return the default value (EmailProviderType.BREVO)
          }
          if (key === 'EMAIL_SERVICE_API_KEY') {
            return 'test-api-key';
          }
          if (key === 'EMAIL_SERVICE_SENDER_EMAIL') {
            return 'test@example.com';
          }
          return defaultValue;
        }),
      };

      const factoryWithConfig = new EmailProviderFactory(mockConfig as any);
      const provider = factoryWithConfig.createProviderFromConfig();

      expect(provider.getProviderName()).toBe(EmailProviderType.BREVO);
    });
  });
});
