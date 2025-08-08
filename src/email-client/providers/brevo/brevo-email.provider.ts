import * as SibApiV3Sdk from '@getbrevo/brevo';
import { BaseEmailProvider } from '../base/base-email.provider';
import { SendEmailOptions, EmailResult, EmailProviderConfig, EmailProviderType } from '../../types';

export class BrevoEmailProvider extends BaseEmailProvider {
  private readonly apiInstance: SibApiV3Sdk.TransactionalEmailsApi;
  private readonly senderEmail: string;

  constructor(config: EmailProviderConfig) {
    super();
    
    if (!config.apiKey) {
      throw new Error('Brevo API key is required');
    }

    if (!config.senderEmail) {
      throw new Error('Sender email is required for Brevo provider');
    }

    this.senderEmail = config.senderEmail;

    // Configure API key authorization
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, config.apiKey);
    this.apiInstance = apiInstance;
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
      this.validateEmailOptions(options);

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
      
      // Generate a unique message ID since Brevo doesn't return one in the response
      const messageId = `brevo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return this.createSuccessResult(messageId);
    } catch (error) {
      this.logger.debug(error);
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return this.createErrorResult(`Failed to send email: ${error.message}`);
    }
  }

  getProviderName(): string {
    return EmailProviderType.BREVO;
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check - try to send a test email (but don't actually send it)
      // We'll just check if the API instance is properly configured
      return this.apiInstance !== undefined && this.senderEmail !== undefined;
    } catch (error) {
      this.logger.warn(`Brevo health check failed: ${error.message}`);
      return false;
    }
  }
}
