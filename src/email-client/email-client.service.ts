import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendEmailOptions, EmailResult, EmailClientInterface } from './types';
import { EMAIL_PROVIDER_FACTORY } from './email-client.constants';
import { EmailProviderFactory } from './providers/email-provider.factory';

@Injectable()
export class EmailClientService implements EmailClientInterface {
  private readonly logger = new Logger(EmailClientService.name);
  private readonly provider: EmailClientInterface;

  constructor(
    private readonly configService: ConfigService,
    @Inject(EMAIL_PROVIDER_FACTORY)
    private readonly providerFactory: EmailProviderFactory,
  ) {
    this.provider = this.providerFactory.createProviderFromConfig();
    this.logger.log(`Initialized email client with provider: ${this.provider.getProviderName()}`);
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    return this.provider.sendEmail(options);
  }

  getProviderName(): string {
    return this.provider.getProviderName();
  }

  async isHealthy(): Promise<boolean> {
    return this.provider.isHealthy();
  }
} 