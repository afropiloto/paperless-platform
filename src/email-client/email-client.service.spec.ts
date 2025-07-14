import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailClientService } from './email-client.service';
import { SendEmailOptions } from './types/email-client.types';

describe('EmailClientService', () => {
  let service: EmailClientService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock values
    mockConfigService.get.mockReturnValue('test-api-key'); // API key
    mockConfigService.get.mockReturnValue('test@example.com'); // sender email
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailClientService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailClientService>(EmailClientService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error if EMAIL_SERVICE_API_KEY is missing', () => {
      const tempMockConfig = { get: jest.fn() };
      tempMockConfig.get.mockReturnValueOnce(undefined); // API key
      tempMockConfig.get.mockReturnValueOnce('test@example.com'); // sender email

      expect(() => new EmailClientService(tempMockConfig as any)).toThrow(
        'EMAIL_SERVICE_API_KEY environment variable is required',
      );
    });

    it('should throw error if EMAIL_SERVICE_SENDER_EMAIL is missing', () => {
      const tempMockConfig = { get: jest.fn() };
      tempMockConfig.get.mockReturnValueOnce('test-api-key'); // API key
      tempMockConfig.get.mockReturnValueOnce(undefined); // sender email

      expect(() => new EmailClientService(tempMockConfig as any)).toThrow(
        'EMAIL_SERVICE_SENDER_EMAIL environment variable is required',
      );
    });

    it('should initialize successfully with valid environment variables', () => {
      const tempMockConfig = { get: jest.fn() };
      tempMockConfig.get.mockReturnValueOnce('test-api-key'); // API key
      tempMockConfig.get.mockReturnValueOnce('test@example.com'); // sender email

      expect(() => new EmailClientService(tempMockConfig as any)).not.toThrow();
    });
  });

  describe('sendEmail', () => {

    it('should handle single email recipient', async () => {
      const emailOptions: SendEmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test Content</h1>',
      };

      // Mock the Brevo API call
      const mockSendTransacEmail = jest.fn().mockResolvedValue({ response: {}, body: {} });
      jest.spyOn(service as any, 'apiInstance', 'get').mockReturnValue({
        sendTransacEmail: mockSendTransacEmail,
      });

      await service.sendEmail(emailOptions);

      expect(mockSendTransacEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email: 'recipient@example.com' }],
          subject: 'Test Subject',
          htmlContent: '<h1>Test Content</h1>',
          sender: { email: 'test@example.com' },
        }),
      );
    });

    it('should handle multiple email recipients', async () => {
      const emailOptions: SendEmailOptions = {
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test Subject',
        htmlContent: '<h1>Test Content</h1>',
      };

      const mockSendTransacEmail = jest.fn().mockResolvedValue({ response: {}, body: {} });
      jest.spyOn(service as any, 'apiInstance', 'get').mockReturnValue({
        sendTransacEmail: mockSendTransacEmail,
      });

      await service.sendEmail(emailOptions);

      expect(mockSendTransacEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [
            { email: 'recipient1@example.com' },
            { email: 'recipient2@example.com' },
          ],
        }),
      );
    });

    it('should handle optional fields', async () => {
      const emailOptions: SendEmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test Content</h1>',
        textContent: 'Test Content',
        replyTo: 'reply@example.com',
        cc: ['cc1@example.com', 'cc2@example.com'],
        bcc: ['bcc@example.com'],
      };

      const mockSendTransacEmail = jest.fn().mockResolvedValue({ response: {}, body: {} });
      jest.spyOn(service as any, 'apiInstance', 'get').mockReturnValue({
        sendTransacEmail: mockSendTransacEmail,
      });

      await service.sendEmail(emailOptions);

      expect(mockSendTransacEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          textContent: 'Test Content',
          replyTo: { email: 'reply@example.com' },
          cc: [
            { email: 'cc1@example.com' },
            { email: 'cc2@example.com' },
          ],
          bcc: [{ email: 'bcc@example.com' }],
        }),
      );
    });

    it('should throw error when API call fails', async () => {
      const emailOptions: SendEmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test Content</h1>',
      };

      const mockSendTransacEmail = jest.fn().mockRejectedValue(new Error('API Error'));
      jest.spyOn(service as any, 'apiInstance', 'get').mockReturnValue({
        sendTransacEmail: mockSendTransacEmail,
      });

      await expect(service.sendEmail(emailOptions)).rejects.toThrow('Failed to send email: API Error');
    });
  });
}); 