import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE, EmailJobType } from '../constants/app.constants';
import { EmailJobData } from './email-events.types';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue<EmailJobData>,
  ) {}

  /**
   * Add an email job to the queue
   */
  async addEmailJob(jobData: EmailJobData, options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
  }): Promise<void> {
    try {
      const jobName = `${jobData.jobType}-${Date.now()}`;
      
      await this.emailQueue.add(
        jobName,
        jobData,
        {
          delay: options?.delay || 0,
          priority: options?.priority || 0,
          attempts: options?.attempts || 3,
          backoff: options?.backoff || {
            type: 'exponential',
            delay: 2000, // 2 seconds initial delay
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
        }
      );

      this.logger.log(`Email job added to queue: ${jobName} for ${jobData.jobType}`);
    } catch (error) {
      this.logger.error(`Failed to add email job to queue: ${error.message}`, error.stack);
      throw new Error(`Failed to queue email job: ${error.message}`);
    }
  }

  /**
   * Add password reset email job
   */
  async addPasswordResetEmailJob(
    to: string,
    userName: string,
    resetToken: string,
    expiryMinutes: number,
    options?: { delay?: number; priority?: number; attempts?: number }
  ): Promise<void> {
    const jobData: EmailJobData = {
      jobType: EmailJobType.PASSWORD_RESET,
      to,
      userName,
      resetToken,
      expiryMinutes,
    };

    await this.addEmailJob(jobData, options);
  }

  /**
   * Add welcome email job
   */
  async addWelcomeEmailJob(
    to: string,
    userName: string,
    options?: { delay?: number; priority?: number; attempts?: number }
  ): Promise<void> {
    const jobData: EmailJobData = {
      jobType: EmailJobType.WELCOME_EMAIL,
      to,
      userName,
    };

    await this.addEmailJob(jobData, options);
  }

  /**
   * Add user invitation email job
   */
  async addUserInvitationEmailJob(
    to: string,
    userName: string,
    inviterName: string,
    temporaryPassword: string,
    customMessage?: string,
    options?: { delay?: number; priority?: number; attempts?: number }
  ): Promise<void> {
    const jobData: EmailJobData = {
      jobType: EmailJobType.USER_INVITATION,
      to,
      userName,
      inviterName,
      temporaryPassword,
      customMessage,
    };

    await this.addEmailJob(jobData, options);
  }

  /**
   * Add MFA setup email job
   */
  async addMfaSetupEmailJob(
    to: string,
    userName: string,
    backupCodes: string[],
    qrCodeUrl?: string,
    options?: { delay?: number; priority?: number; attempts?: number }
  ): Promise<void> {
    const jobData: EmailJobData = {
      jobType: EmailJobType.MFA_SETUP,
      to,
      userName,
      backupCodes,
      qrCodeUrl,
    };

    await this.addEmailJob(jobData, options);
  }

  /**
   * Add MFA backup codes email job
   */
  async addMfaBackupCodesEmailJob(
    to: string,
    userName: string,
    backupCodes: string[],
    options?: { delay?: number; priority?: number; attempts?: number }
  ): Promise<void> {
    const jobData: EmailJobData = {
      jobType: EmailJobType.MFA_BACKUP_CODES,
      to,
      userName,
      backupCodes,
    };

    await this.addEmailJob(jobData, options);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaiting(),
      this.emailQueue.getActive(),
      this.emailQueue.getCompleted(),
      this.emailQueue.getFailed(),
      this.emailQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }
}
