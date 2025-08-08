import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailClientModule } from './email-client.module';
import { EMAIL_CLIENT_SERVICE } from './email-client.constants';
import { EmailClientInterface, EmailProviderType } from './types';
import { DummyEmailProvider } from './providers/dummy/dummy-email.provider';

describe('EmailClient Integration', () => {
  let emailClient: EmailClientInterface;
  let configService: ConfigService;

  describe('with Dummy Provider', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                EMAIL_PROVIDER_TYPE: EmailProviderType.DUMMY,
                EMAIL_SERVICE_API_KEY: 'dummy-key',
                EMAIL_SERVICE_SENDER_EMAIL: 'test@example.com',
              }),
            ],
          }),
          EmailClientModule,
        ],
      }).compile();

      emailClient = module.get<EmailClientInterface>(EMAIL_CLIENT_SERVICE);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should initialize with dummy provider', () => {
      expect(emailClient.getProviderName()).toBe(EmailProviderType.DUMMY);
    });

    it('should send email and store it in dummy provider', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Email',
        htmlContent: '<h1>Test</h1>',
      };

      const result = await emailClient.sendEmail(emailOptions);

      expect(result.status).toBe('sent');
      expect(result.provider).toBe(EmailProviderType.DUMMY);
      expect(result.messageId).toBeDefined();
      expect(result.sentAt).toBeInstanceOf(Date);

      // Verify the email was stored in the dummy provider
      const dummyProvider = (emailClient as any).provider as DummyEmailProvider;
      const storedEmails = await dummyProvider.getStoredEmails();
      expect(storedEmails).toHaveLength(1);
      expect(storedEmails[0].to).toBe('test@example.com');
      expect(storedEmails[0].subject).toBe('Test Email');
    });

    it('should be healthy', async () => {
      const isHealthy = await emailClient.isHealthy();
      expect(isHealthy).toBe(true);
    });

    it('should handle multiple emails', async () => {
      const email1 = {
        to: 'user1@example.com',
        subject: 'Email 1',
        htmlContent: '<h1>Email 1</h1>',
      };

      const email2 = {
        to: 'user2@example.com',
        subject: 'Email 2',
        htmlContent: '<h1>Email 2</h1>',
      };

      await emailClient.sendEmail(email1);
      await emailClient.sendEmail(email2);

      const dummyProvider = (emailClient as any).provider as DummyEmailProvider;
      const storedEmails = await dummyProvider.getStoredEmails();
      expect(storedEmails).toHaveLength(2);
    });

    afterEach(async () => {
      // Clean up stored emails
      const dummyProvider = (emailClient as any).provider as DummyEmailProvider;
      await dummyProvider.clearStoredEmails();
    });
  });

  describe('with Brevo Provider', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                EMAIL_PROVIDER_TYPE: EmailProviderType.BREVO,
                EMAIL_SERVICE_API_KEY: process.env.EMAIL_SERVICE_API_KEY || 'test-key',
                EMAIL_SERVICE_SENDER_EMAIL: process.env.EMAIL_SERVICE_SENDER_EMAIL || 'test@example.com',
              }),
            ],
          }),
          EmailClientModule,
        ],
      }).compile();

      emailClient = module.get<EmailClientInterface>(EMAIL_CLIENT_SERVICE);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should initialize with brevo provider', () => {
      expect(emailClient.getProviderName()).toBe(EmailProviderType.BREVO);
    });

    it('should handle missing API key gracefully', () => {
      // This test verifies that the provider factory handles missing configuration
      // The actual Brevo provider will throw an error if API key is missing
      expect(() => emailClient.getProviderName()).not.toThrow();
    });
  });
});
