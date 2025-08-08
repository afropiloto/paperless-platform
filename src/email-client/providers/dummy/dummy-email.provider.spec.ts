import { Test, TestingModule } from '@nestjs/testing';
import { DummyEmailProvider } from './dummy-email.provider';
import { EmailProviderType } from '../../types';
import { DiskStorageConfig } from './dummy-email-disk-storage';

describe('DummyEmailProvider', () => {
  let provider: DummyEmailProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DummyEmailProvider],
    }).compile();

    provider = module.get<DummyEmailProvider>(DummyEmailProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should return dummy as provider name', () => {
    expect(provider.getProviderName()).toBe(EmailProviderType.DUMMY);
  });

  it('should always be healthy', async () => {
    const isHealthy = await provider.isHealthy();
    expect(isHealthy).toBe(true);
  });

  describe('sendEmail', () => {
    it('should store email and return success result', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test</h1>',
      };

      const result = await provider.sendEmail(emailOptions);

      expect(result.status).toBe('sent');
      expect(result.provider).toBe(EmailProviderType.DUMMY);
      expect(result.messageId).toBeDefined();
      expect(result.sentAt).toBeInstanceOf(Date);
    });

    it('should store multiple emails', async () => {
      const email1 = {
        to: 'test1@example.com',
        subject: 'Test 1',
        htmlContent: '<h1>Test 1</h1>',
      };

      const email2 = {
        to: 'test2@example.com',
        subject: 'Test 2',
        htmlContent: '<h1>Test 2</h1>',
      };

      await provider.sendEmail(email1);
      await provider.sendEmail(email2);

      const storedEmails = await provider.getStoredEmails();
      expect(storedEmails).toHaveLength(2);
    });

    it('should validate email options', async () => {
      const invalidEmailOptions = {
        to: '',
        subject: 'Test Subject',
        htmlContent: '<h1>Test</h1>',
      };

      const result = await provider.sendEmail(invalidEmailOptions);
      
      expect(result.status).toBe('failed');
      expect(result.provider).toBe(EmailProviderType.DUMMY);
      expect(result.error).toContain('At least one recipient email is required');
    });
  });

  describe('testing methods', () => {
    beforeEach(async () => {
      await provider.clearStoredEmails();
    });

    it('should find emails by recipient', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test</h1>',
      };

      await provider.sendEmail(emailOptions);

      const foundEmails = await provider.findByRecipient('test@example.com');
      expect(foundEmails).toHaveLength(1);
      expect(foundEmails[0].to).toBe('test@example.com');
    });

    it('should find emails by subject', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test</h1>',
      };

      await provider.sendEmail(emailOptions);

      const foundEmails = await provider.findBySubject('Test');
      expect(foundEmails).toHaveLength(1);
      expect(foundEmails[0].subject).toBe('Test Subject');
    });

    it('should clear stored emails', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test</h1>',
      };

      await provider.sendEmail(emailOptions);
      expect(await provider.getStoredEmailCount()).toBe(1);

      await provider.clearStoredEmails();
      expect(await provider.getStoredEmailCount()).toBe(0);
    });
  });

  describe('disk storage functionality', () => {
    it('should have default disk storage configuration', () => {
      const config = provider.getDiskStorageConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.directory).toBe('./dummy-emails');
      expect(config.format).toBe('both');
      expect(config.includeMetadata).toBe(true);
    });

    it('should update disk storage configuration', () => {
      const newConfig: Partial<DiskStorageConfig> = {
        enabled: true,
        directory: './test-emails',
        format: 'html',
        includeMetadata: false,
      };

      provider.updateDiskStorageConfig(newConfig);
      const config = provider.getDiskStorageConfig();

      expect(config.enabled).toBe(true);
      expect(config.directory).toBe('./test-emails');
      expect(config.format).toBe('html');
      expect(config.includeMetadata).toBe(false);
    });

    it('should enable disk storage with custom settings', async () => {
      await provider.enableDiskStorage('./custom-emails', 'json');

      const config = provider.getDiskStorageConfig();
      expect(config.enabled).toBe(true);
      expect(config.directory).toBe('./custom-emails');
      expect(config.format).toBe('json');
    });

    it('should disable disk storage', async () => {
      // First enable it
      await provider.enableDiskStorage();
      expect(provider.getDiskStorageConfig().enabled).toBe(true);

      // Then disable it
      await provider.disableDiskStorage();
      expect(provider.getDiskStorageConfig().enabled).toBe(false);
    });
  });
});
