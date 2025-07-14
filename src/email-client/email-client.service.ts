import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from '@getbrevo/brevo';
import { SendEmailOptions, EmailClientInterface } from './types/email-client.types';

@Injectable()
export class EmailClientService implements EmailClientInterface {
  private readonly logger = new Logger(EmailClientService.name);
  private readonly apiInstance: SibApiV3Sdk.TransactionalEmailsApi;
  private readonly senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('EMAIL_SERVICE_API_KEY');
    this.senderEmail = this.configService.get<string>('EMAIL_SERVICE_SENDER_EMAIL');

    if (!apiKey) {
      throw new Error('EMAIL_SERVICE_API_KEY environment variable is required');
    }

    if (!this.senderEmail) {
      throw new Error('EMAIL_SERVICE_SENDER_EMAIL environment variable is required');
    }

    // Configure API key authorization
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    this.apiInstance = apiInstance;
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const { to, subject, htmlContent, textContent, replyTo, cc, bcc } = options;

      // Prepare recipients
      const toRecipients = Array.isArray(to) ? to : [to];
      const ccRecipients = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
      const bccRecipients = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.to = toRecipients.map(email => ({ email }));
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      sendSmtpEmail.sender = { email: this.senderEmail };

      if (textContent) {
        sendSmtpEmail.textContent = textContent;
      }

      if (replyTo) {
        sendSmtpEmail.replyTo = { email: replyTo };
      }

      if (ccRecipients.length > 0) {
        sendSmtpEmail.cc = ccRecipients.map(email => ({ email }));
      }

      if (bccRecipients.length > 0) {
        sendSmtpEmail.bcc = bccRecipients.map(email => ({ email }));
      }

      this.logger.log(`Sending email to: ${toRecipients.join(', ')} with subject: ${subject}`);
      
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      this.logger.log(`Email sent successfully. Response: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
} 