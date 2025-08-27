import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailQueueService } from './email-queue.service';
import { EMAIL_QUEUE, EmailJobType } from '../constants/app.constants';
import { EmailJobData } from './email-events.types';

describe('EmailQueueService', () => {
  let service: EmailQueueService;
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const mockQueueAdd = jest.fn();
    const mockQueueGetWaiting = jest.fn().mockResolvedValue([]);
    const mockQueueGetActive = jest.fn().mockResolvedValue([]);
    const mockQueueGetCompleted = jest.fn().mockResolvedValue([]);
    const mockQueueGetFailed = jest.fn().mockResolvedValue([]);
    const mockQueueGetDelayed = jest.fn().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailQueueService,
        {
          provide: getQueueToken(EMAIL_QUEUE),
          useValue: {
            add: mockQueueAdd,
            getWaiting: mockQueueGetWaiting,
            getActive: mockQueueGetActive,
            getCompleted: mockQueueGetCompleted,
            getFailed: mockQueueGetFailed,
            getDelayed: mockQueueGetDelayed,
          },
        },
      ],
    }).compile();

    service = module.get<EmailQueueService>(EmailQueueService);
    mockQueue = module.get(getQueueToken(EMAIL_QUEUE));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addPasswordResetEmailJob', () => {
    it('should add password reset email job to queue', async () => {
      const to = 'test@example.com';
      const userName = 'John Doe';
      const resetToken = 'token-123';
      const expiryMinutes = 30;

      await service.addPasswordResetEmailJob(to, userName, resetToken, expiryMinutes);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.stringContaining('password-reset'),
        {
          jobType: EmailJobType.PASSWORD_RESET,
          to,
          userName,
          resetToken,
          expiryMinutes,
        },
        expect.objectContaining({
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        })
      );
    });
  });

  describe('addWelcomeEmailJob', () => {
    it('should add welcome email job to queue', async () => {
      const to = 'test@example.com';
      const userName = 'John Doe';

      await service.addWelcomeEmailJob(to, userName);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.stringContaining('welcome-email'),
        {
          jobType: EmailJobType.WELCOME_EMAIL,
          to,
          userName,
        },
        expect.any(Object)
      );
    });
  });

  describe('addUserInvitationEmailJob', () => {
    it('should add user invitation email job to queue', async () => {
      const to = 'test@example.com';
      const userName = 'John Doe';
      const inviterName = 'Admin User';
      const temporaryPassword = 'temp-pass-123';
      const customMessage = 'Welcome!';

      await service.addUserInvitationEmailJob(
        to,
        userName,
        inviterName,
        temporaryPassword,
        customMessage
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.stringContaining('user-invitation'),
        {
          jobType: EmailJobType.USER_INVITATION,
          to,
          userName,
          inviterName,
          temporaryPassword,
          customMessage,
        },
        expect.any(Object)
      );
    });
  });

  describe('addMfaSetupEmailJob', () => {
    it('should add MFA setup email job to queue', async () => {
      const to = 'test@example.com';
      const userName = 'John Doe';
      const backupCodes = ['123456', '789012'];
      const qrCodeUrl = 'https://example.com/qr.png';

      await service.addMfaSetupEmailJob(to, userName, backupCodes, qrCodeUrl);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.stringContaining('mfa-setup'),
        {
          jobType: EmailJobType.MFA_SETUP,
          to,
          userName,
          backupCodes,
          qrCodeUrl,
        },
        expect.any(Object)
      );
    });
  });

  describe('addMfaBackupCodesEmailJob', () => {
    it('should add MFA backup codes email job to queue', async () => {
      const to = 'test@example.com';
      const userName = 'John Doe';
      const backupCodes = ['123456', '789012'];

      await service.addMfaBackupCodesEmailJob(to, userName, backupCodes);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.stringContaining('mfa-backup-codes'),
        {
          jobType: EmailJobType.MFA_BACKUP_CODES,
          to,
          userName,
          backupCodes,
        },
        expect.any(Object)
      );
    });
  });

  describe('addForcePasswordResetEmailJob', () => {
    it('should add force password reset email job to queue', async () => {
      const to = 'test@example.com';
      const userName = 'John Doe';
      const reason = 'Security policy compliance';

      await service.addForcePasswordResetEmailJob(to, userName, reason);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.stringContaining('force-password-reset'),
        {
          jobType: EmailJobType.FORCE_PASSWORD_RESET,
          to,
          userName,
          reason,
        },
        expect.any(Object)
      );
    });

    it('should add force password reset email job without reason', async () => {
      const to = 'test@example.com';
      const userName = 'John Doe';

      await service.addForcePasswordResetEmailJob(to, userName);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.stringContaining('force-password-reset'),
        {
          jobType: EmailJobType.FORCE_PASSWORD_RESET,
          to,
          userName,
          reason: undefined,
        },
        expect.any(Object)
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });

      expect(mockQueue.getWaiting).toHaveBeenCalled();
      expect(mockQueue.getActive).toHaveBeenCalled();
      expect(mockQueue.getCompleted).toHaveBeenCalled();
      expect(mockQueue.getFailed).toHaveBeenCalled();
      expect(mockQueue.getDelayed).toHaveBeenCalled();
    });
  });

  describe('addEmailJob with options', () => {
    it('should add email job with custom options', async () => {
      const jobData: EmailJobData = {
        jobType: EmailJobType.PASSWORD_RESET,
        to: 'test@example.com',
        userName: 'John Doe',
        resetToken: 'token-123',
        expiryMinutes: 30,
      };

      const options = {
        delay: 5000,
        priority: 10,
        attempts: 5,
        backoff: {
          type: 'fixed' as const,
          delay: 1000,
        },
      };

      await service.addEmailJob(jobData, options);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.stringContaining('password-reset'),
        jobData,
        expect.objectContaining({
          delay: 5000,
          priority: 10,
          attempts: 5,
          backoff: {
            type: 'fixed',
            delay: 1000,
          },
        })
      );
    });
  });
});
