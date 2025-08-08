import { BaseEmailProvider } from '../base/base-email.provider';
import { SendEmailOptions, EmailResult, EmailProviderConfig, EmailProviderType } from '../../types';
import { DummyEmailStorage, StoredEmail } from './dummy-email.storage';
import { DummyEmailDiskStorage, DiskStorageConfig } from './dummy-email-disk-storage';

export class DummyEmailProvider extends BaseEmailProvider {
  private readonly storage: DummyEmailStorage;
  private readonly diskStorage: DummyEmailDiskStorage;

  constructor(config?: EmailProviderConfig) {
    super();
    this.storage = new DummyEmailStorage();
    
    // Initialize disk storage with configuration from provider config
    const diskConfig: Partial<DiskStorageConfig> = {
      enabled: config?.diskStorageEnabled ?? false,
      directory: config?.diskStorageDirectory ?? './dummy-emails',
      format: config?.diskStorageFormat ?? 'both',
      includeMetadata: config?.diskStorageIncludeMetadata ?? true,
    };
    
    this.diskStorage = new DummyEmailDiskStorage(diskConfig);
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
      this.validateEmailOptions(options);

      const emailRecord: Omit<StoredEmail, 'id'> = {
        ...options,
        sentAt: new Date(),
        provider: this.getProviderName(),
      };

      await this.storage.store(emailRecord);

      // Get the stored email to get the generated ID
      const storedEmails = await this.storage.getAll();
      const storedEmail = storedEmails[storedEmails.length - 1];

      // Write email to disk if enabled
      await this.diskStorage.writeEmailToDisk(storedEmail);

      this.logger.log(`Dummy email stored with ID: ${storedEmail.id}`);
      this.logger.log(`To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      this.logger.log(`Subject: ${options.subject}`);

      return this.createSuccessResult(storedEmail.id);
    } catch (error) {
      this.logger.error(`Failed to store dummy email: ${error.message}`, error.stack);
      return this.createErrorResult(`Failed to store dummy email: ${error.message}`);
    }
  }

  getProviderName(): string {
    return EmailProviderType.DUMMY;
  }

  async isHealthy(): Promise<boolean> {
    // Dummy provider is always healthy
    return true;
  }

  // Additional methods for testing
  async getStoredEmails(): Promise<StoredEmail[]> {
    return this.storage.getAll();
  }

  async clearStoredEmails(): Promise<void> {
    return this.storage.clear();
  }

  async findByRecipient(email: string): Promise<StoredEmail[]> {
    return this.storage.findByRecipient(email);
  }

  async findBySubject(subject: string): Promise<StoredEmail[]> {
    return this.storage.findBySubject(subject);
  }

  async findById(id: string): Promise<StoredEmail | undefined> {
    return this.storage.findById(id);
  }

  async getStoredEmailCount(): Promise<number> {
    return this.storage.getCount();
  }

  // Disk storage management methods
  getDiskStorageConfig(): DiskStorageConfig {
    return this.diskStorage.getConfig();
  }

  updateDiskStorageConfig(config: Partial<DiskStorageConfig>): void {
    this.diskStorage.updateConfig(config);
  }

  async enableDiskStorage(directory?: string, format?: 'json' | 'html' | 'both'): Promise<void> {
    this.diskStorage.updateConfig({
      enabled: true,
      ...(directory && { directory }),
      ...(format && { format }),
    });
    this.logger.log(`Disk storage enabled. Directory: ${this.diskStorage.getConfig().directory}`);
  }

  async disableDiskStorage(): Promise<void> {
    this.diskStorage.updateConfig({ enabled: false });
    this.logger.log('Disk storage disabled');
  }
}
