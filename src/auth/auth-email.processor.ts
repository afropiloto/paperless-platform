import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_QUEUE, EmailJobType } from '../constants/app.constants';
import { EmailJobData, EmailJobResult } from '../email-events/email-events.types';
import { EMAIL_CLIENT_SERVICE } from '../email-client/email-client.constants';
import { EmailClientInterface } from '../email-client/types';
import { EmailTemplatesService } from './services/email-templates.service';

@Injectable()
@Processor(EMAIL_QUEUE)
export class AuthEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(AuthEmailProcessor.name);
  private readonly appUrl: string;

  constructor(
    @Inject(EMAIL_CLIENT_SERVICE)
    private readonly emailClient: EmailClientInterface,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.appUrl = this.configService.get<string>('app.url') || 'http://localhost:3001';
  }

  async process(job: Job<EmailJobData>): Promise<EmailJobResult> {
    const { data } = job;
    const jobId = job.id;
    const attempt = job.attemptsMade + 1;

    // Only process auth-related email types
    if (!this.isAuthEmailType(data.jobType)) {
      this.logger.warn(`Skipping non-auth email job ${jobId}: ${data.jobType}`);
      return {
        provider: this.emailClient.getProviderName(),
        sentAt: new Date(),
        status: 'failed',
        error: `Unsupported email type for auth processor: ${data.jobType}`,
        retryCount: attempt,
      };
    }

    this.logger.log(`Processing auth email job ${jobId} (attempt ${attempt}): ${data.jobType}`);

    try {
      let emailResult: EmailJobResult;

      switch (data.jobType) {
        case EmailJobType.PASSWORD_RESET:
          emailResult = await this.processPasswordResetEmail(data);
          break;
        case EmailJobType.WELCOME_EMAIL:
          emailResult = await this.processWelcomeEmail(data);
          break;
        case EmailJobType.USER_INVITATION:
          emailResult = await this.processUserInvitationEmail(data);
          break;
        case EmailJobType.MFA_SETUP:
          emailResult = await this.processMfaSetupEmail(data);
          break;
        case EmailJobType.MFA_BACKUP_CODES:
          emailResult = await this.processMfaBackupCodesEmail(data);
          break;
        case EmailJobType.FORCE_PASSWORD_RESET:
          emailResult = await this.processForcePasswordResetEmail(data);
          break;
      }

      this.logger.log(`Auth email job ${jobId} completed successfully: ${emailResult.messageId}`);
      return emailResult;
    } catch (error) {
      this.logger.error(`Auth email job ${jobId} failed (attempt ${attempt}): ${error.message}`, error.stack);
      
      const errorResult: EmailJobResult = {
        provider: this.emailClient.getProviderName(),
        sentAt: new Date(),
        status: 'failed',
        error: error.message,
        retryCount: attempt,
      };

      // If this is the final attempt, log the failure permanently
      if (attempt >= (job.opts.attempts || 3)) {
        this.logger.error(`Auth email job ${jobId} permanently failed after ${attempt} attempts`);
      }

      throw error; // Re-throw to trigger retry mechanism
    }
  }

  private isAuthEmailType(jobType: EmailJobType): boolean {
    return [
      EmailJobType.PASSWORD_RESET,
      EmailJobType.WELCOME_EMAIL,
      EmailJobType.USER_INVITATION,
      EmailJobType.MFA_SETUP,
      EmailJobType.MFA_BACKUP_CODES,
      EmailJobType.FORCE_PASSWORD_RESET,
    ].includes(jobType);
  }

  private async processPasswordResetEmail(data: any): Promise<EmailJobResult> {
    const resetUrl = `${this.appUrl}/reset-password?token=${data.resetToken}`;
    
    const emailData = {
      userName: data.userName,
      resetUrl,
      expiryMinutes: data.expiryMinutes,
    };

    const { subject, htmlContent, textContent } = this.emailTemplates.generatePasswordResetEmail(emailData);

    const result = await this.emailClient.sendEmail({
      to: data.to,
      subject,
      htmlContent,
      textContent,
      replyTo: data.replyTo,
      cc: data.cc,
      bcc: data.bcc,
      attachments: data.attachments,
      metadata: data.metadata,
    });

    return {
      messageId: result.messageId,
      provider: result.provider,
      sentAt: result.sentAt,
      status: result.status,
      error: result.error,
    };
  }

  private async processWelcomeEmail(data: any): Promise<EmailJobResult> {
    const loginUrl = `${this.appUrl}/login`;
    
    const emailData = {
      userName: data.userName,
      loginUrl,
    };

    const { subject, htmlContent, textContent } = this.emailTemplates.generateWelcomeEmail(emailData);

    const result = await this.emailClient.sendEmail({
      to: data.to,
      subject,
      htmlContent,
      textContent,
      replyTo: data.replyTo,
      cc: data.cc,
      bcc: data.bcc,
      attachments: data.attachments,
      metadata: data.metadata,
    });

    return {
      messageId: result.messageId,
      provider: result.provider,
      sentAt: result.sentAt,
      status: result.status,
      error: result.error,
    };
  }

  private async processUserInvitationEmail(data: any): Promise<EmailJobResult> {
    const loginUrl = `${this.appUrl}/login`;
    
    const emailData = {
      userName: data.userName,
      inviterName: data.inviterName,
      loginUrl,
      temporaryPassword: data.temporaryPassword,
      customMessage: data.customMessage,
    };

    const { subject, htmlContent, textContent } = this.emailTemplates.generateUserInvitationEmail(emailData);

    const result = await this.emailClient.sendEmail({
      to: data.to,
      subject,
      htmlContent,
      textContent,
      replyTo: data.replyTo,
      cc: data.cc,
      bcc: data.bcc,
      attachments: data.attachments,
      metadata: data.metadata,
    });

    return {
      messageId: result.messageId,
      provider: result.provider,
      sentAt: result.sentAt,
      status: result.status,
      error: result.error,
    };
  }

  private async processMfaSetupEmail(data: any): Promise<EmailJobResult> {
    const emailData = {
      userName: data.userName,
      backupCodes: data.backupCodes,
      qrCodeUrl: data.qrCodeUrl,
    };

    const { subject, htmlContent, textContent } = this.emailTemplates.generateMfaSetupEmail(emailData);

    const result = await this.emailClient.sendEmail({
      to: data.to,
      subject,
      htmlContent,
      textContent,
      replyTo: data.replyTo,
      cc: data.cc,
      bcc: data.bcc,
      attachments: data.attachments,
      metadata: data.metadata,
    });

    return {
      messageId: result.messageId,
      provider: result.provider,
      sentAt: result.sentAt,
      status: result.status,
      error: result.error,
    };
  }

  private async processMfaBackupCodesEmail(data: any): Promise<EmailJobResult> {
    const emailData = {
      userName: data.userName,
      backupCodes: data.backupCodes,
    };

    const { subject, htmlContent, textContent } = this.emailTemplates.generateMfaBackupCodesEmail(emailData);

    const result = await this.emailClient.sendEmail({
      to: data.to,
      subject,
      htmlContent,
      textContent,
      replyTo: data.replyTo,
      cc: data.cc,
      bcc: data.bcc,
      attachments: data.attachments,
      metadata: data.metadata,
    });

    return {
      messageId: result.messageId,
      provider: result.provider,
      sentAt: result.sentAt,
      status: result.status,
      error: result.error,
    };
  }

  private async processForcePasswordResetEmail(data: any): Promise<EmailJobResult> {
    const emailData = {
      userName: data.userName,
      reason: data.reason,
    };

    const { subject, htmlContent, textContent } = this.emailTemplates.generateForcePasswordResetEmail(emailData);

    const result = await this.emailClient.sendEmail({
      to: data.to,
      subject,
      htmlContent,
      textContent,
      replyTo: data.replyTo,
      cc: data.cc,
      bcc: data.bcc,
      attachments: data.attachments,
      metadata: data.metadata,
    });

    return {
      messageId: result.messageId,
      provider: result.provider,
      sentAt: result.sentAt,
      status: result.status,
      error: result.error,
    };
  }
}
