// Example: How another module (e.g., notifications) could implement its own email processor
// This file is for documentation purposes only

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { EMAIL_QUEUE } from '../constants/app.constants';
import { EmailJobData, EmailJobResult } from './email-events.types';
import { EMAIL_CLIENT_SERVICE } from '../email-client/email-client.constants';
import { EmailClientInterface } from '../email-client/types';

// STEP 1: Add the new email type to app.constants.ts:
// export enum EmailJobType {
//   PASSWORD_RESET = 'password-reset',
//   WELCOME_EMAIL = 'welcome-email',
//   USER_INVITATION = 'user-invitation',
//   MFA_SETUP = 'mfa-setup',
//   MFA_BACKUP_CODES = 'mfa-backup-codes',
//   NOTIFICATION = 'notification', // New type
// }

// STEP 2: Add the job data interface to email-events.types.ts:
// export interface NotificationEmailJobData extends BaseEmailJobData {
//   jobType: EmailJobType.NOTIFICATION;
//   userName: string;
//   notificationType: string;
//   notificationData: Record<string, any>;
// }

// STEP 3: Update the union type in email-events.types.ts:
// export type EmailJobData = 
//   | PasswordResetEmailJobData
//   | WelcomeEmailJobData
//   | UserInvitationEmailJobData
//   | MfaSetupEmailJobData
//   | MfaBackupCodesEmailJobData
//   | NotificationEmailJobData; // Add this line

// STEP 4: Add method to EmailQueueService:
// async addNotificationEmailJob(
//   to: string,
//   userName: string,
//   notificationType: string,
//   notificationData: Record<string, any>,
//   options?: { delay?: number; priority?: number; attempts?: number }
// ): Promise<void> {
//   const jobData: EmailJobData = {
//     jobType: EmailJobType.NOTIFICATION,
//     to,
//     userName,
//     notificationType,
//     notificationData,
//   };
//   await this.addEmailJob(jobData, options);
// }

@Injectable()
@Processor(EMAIL_QUEUE)
export class NotificationEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationEmailProcessor.name);

  constructor(
    @Inject(EMAIL_CLIENT_SERVICE)
    private readonly emailClient: EmailClientInterface,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<EmailJobResult> {
    const { data } = job;
    const jobId = job.id;
    const attempt = job.attemptsMade + 1;

    // Only process notification-related email types
    // Note: This check would work after adding NOTIFICATION to EmailJobType enum
    if (data.jobType !== 'notification' as any) { // Use string literal until enum is updated
      this.logger.warn(`Skipping non-notification email job ${jobId}: ${data.jobType}`);
      return {
        provider: this.emailClient.getProviderName(),
        sentAt: new Date(),
        status: 'failed',
        error: `Unsupported email type for notification processor: ${data.jobType}`,
        retryCount: attempt,
      };
    }

    // Type assertion for the notification data
    const notificationData = data as any; // Would be properly typed after interface is added
    this.logger.log(`Processing notification email job ${jobId} (attempt ${attempt}): ${notificationData.notificationType}`);

    try {
      const emailResult = await this.processNotificationEmail(notificationData);

      this.logger.log(`Notification email job ${jobId} completed successfully: ${emailResult.messageId}`);
      return emailResult;
    } catch (error) {
      this.logger.error(`Notification email job ${jobId} failed (attempt ${attempt}): ${error.message}`, error.stack);
      
      const errorResult: EmailJobResult = {
        provider: this.emailClient.getProviderName(),
        sentAt: new Date(),
        status: 'failed',
        error: error.message,
        retryCount: attempt,
      };

      // If this is the final attempt, log the failure permanently
      if (attempt >= (job.opts.attempts || 3)) {
        this.logger.error(`Notification email job ${jobId} permanently failed after ${attempt} attempts`);
      }

      throw error; // Re-throw to trigger retry mechanism
    }
  }

  private async processNotificationEmail(data: any): Promise<EmailJobResult> {
    // Generate email content based on notification type
    const { subject, htmlContent, textContent } = this.generateNotificationEmail(data);

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

  private generateNotificationEmail(data: any): { subject: string; htmlContent: string; textContent: string } {
    // Implementation would depend on the notification type
    const subject = `Notification: ${data.notificationType}`;
    const htmlContent = `<h1>Hello ${data.userName}</h1><p>You have a new notification.</p>`;
    const textContent = `Hello ${data.userName}\n\nYou have a new notification.`;

    return { subject, htmlContent, textContent };
  }
}

// STEP 5: In the module's module file (e.g., notifications.module.ts):
// @Module({
//   imports: [
//     EmailEventsModule, // Import the shared email events module
//   ],
//   providers: [
//     NotificationEmailProcessor, // Register the processor
//     // ... other providers
//   ],
// })
// export class NotificationsModule {}

// STEP 6: Usage in a service:
// export class NotificationService {
//   constructor(private readonly emailQueueService: EmailQueueService) {}
//
//   async sendNotificationEmail(
//     userEmail: string,
//     userName: string,
//     notificationType: string,
//     notificationData: Record<string, any>
//   ): Promise<void> {
//     await this.emailQueueService.addNotificationEmailJob(
//       userEmail,
//       userName,
//       notificationType,
//       notificationData
//     );
//   }
// }
