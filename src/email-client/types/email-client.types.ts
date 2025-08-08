export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailResult {
  messageId?: string;
  provider: string;
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string;
}

export interface EmailClientInterface {
  sendEmail(options: SendEmailOptions): Promise<EmailResult>;
  getProviderName(): string;
  isHealthy(): Promise<boolean>;
} 