export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailClientInterface {
  sendEmail(options: SendEmailOptions): Promise<void>;
} 