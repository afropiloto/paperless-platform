import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailClientInterface, EmailProviderConfig, EmailProviderType } from '../types';
import { BrevoEmailProvider } from './brevo/brevo-email.provider';
import { DummyEmailProvider } from './dummy/dummy-email.provider';

@Injectable()
export class EmailProviderFactory {
  constructor(private readonly configService: ConfigService) {}

  createProvider(type: EmailProviderType): EmailClientInterface {
    const config: EmailProviderConfig = {
      type,
      apiKey: this.configService.get<string>('EMAIL_SERVICE_API_KEY'),
      senderEmail: this.configService.get<string>('EMAIL_SERVICE_SENDER_EMAIL'),
      // Dummy provider disk storage configuration
      diskStorageEnabled: this.configService.get<boolean>('DUMMY_EMAIL_DISK_STORAGE_ENABLED'),
      diskStorageDirectory: this.configService.get<string>('DUMMY_EMAIL_DISK_STORAGE_DIRECTORY'),
      diskStorageFormat: this.configService.get<'json' | 'html' | 'both'>('DUMMY_EMAIL_DISK_STORAGE_FORMAT'),
      diskStorageIncludeMetadata: this.configService.get<boolean>('DUMMY_EMAIL_DISK_STORAGE_INCLUDE_METADATA'),
    };

    switch (type) {
      case EmailProviderType.BREVO:
        return new BrevoEmailProvider(config);
      case EmailProviderType.DUMMY:
        return new DummyEmailProvider(config);
      default:
        throw new Error(`Unsupported email provider: ${type}`);
    }
  }

  createProviderFromConfig(): EmailClientInterface {
    const providerType = this.configService.get<EmailProviderType>(
      'EMAIL_PROVIDER_TYPE',
      EmailProviderType.BREVO
    );
    return this.createProvider(providerType);
  }
}
