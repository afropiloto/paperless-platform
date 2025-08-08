import { Logger } from '@nestjs/common';
import { SendEmailOptions, EmailResult, EmailClientInterface } from '../../types';

export abstract class BaseEmailProvider implements EmailClientInterface {
  protected readonly logger = new Logger(this.constructor.name);

  abstract sendEmail(options: SendEmailOptions): Promise<EmailResult>;
  abstract getProviderName(): string;
  abstract isHealthy(): Promise<boolean>;
  
  protected validateEmailOptions(options: SendEmailOptions): void {
    if (!options.to || (Array.isArray(options.to) && options.to.length === 0)) {
      throw new Error('At least one recipient email is required');
    }

    if (!options.subject || options.subject.trim() === '') {
      throw new Error('Email subject is required');
    }

    if (!options.htmlContent || options.htmlContent.trim() === '') {
      throw new Error('HTML content is required');
    }

    // Validate email format for recipients
    const allRecipients = [
      ...(Array.isArray(options.to) ? options.to : [options.to]),
      ...(options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : []),
      ...(options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : []),
    ];

    for (const email of allRecipients) {
      if (!this.isValidEmail(email)) {
        throw new Error(`Invalid email format: ${email}`);
      }
    }
  }

  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  protected createSuccessResult(messageId?: string): EmailResult {
    return {
      messageId,
      provider: this.getProviderName(),
      sentAt: new Date(),
      status: 'sent',
    };
  }

  protected createErrorResult(error: string): EmailResult {
    return {
      provider: this.getProviderName(),
      sentAt: new Date(),
      status: 'failed',
      error,
    };
  }
}
