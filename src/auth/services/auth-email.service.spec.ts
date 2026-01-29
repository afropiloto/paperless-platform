import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EMAIL_CLIENT_SERVICE } from '../../email-client/email-client.constants';
import { EmailClientInterface } from '../../email-client/types';
import { EmailTemplatesService } from './email-templates.service';
import { AuthEmailService } from './auth-email.service';
import { EmailQueueService } from '../../email-events/email-queue.service';

describe('AuthEmailService', () => {
  let service: AuthEmailService;
  let emailClient: EmailClientInterface;
  let emailTemplates: EmailTemplatesService;
  let configService: ConfigService;
  let emailQueueService: EmailQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthEmailService,
        {
          provide: EMAIL_CLIENT_SERVICE,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: EmailTemplatesService,
          useValue: {
            generatePasswordResetEmail: jest.fn(),
            generateMfaSetupEmail: jest.fn(),
            generateMfaBackupCodesEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'app.url': 'https://test.example.com',
                'auth.passwordReset.expiryMinutes': 30,
                'app.name': 'Test App',
                'app.supportEmail': 'test@example.com',
              };
              return config[key];
            }),
          },
        },
        {
          provide: EmailQueueService,
          useValue: {
            addPasswordResetEmailJob: jest.fn(),
            addMfaSetupEmailJob: jest.fn(),
            addMfaBackupCodesEmailJob: jest.fn(),
            addUserInvitationEmailJob: jest.fn(),
            addWelcomeEmailJob: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthEmailService>(AuthEmailService);
    emailClient = module.get<EmailClientInterface>(EMAIL_CLIENT_SERVICE);
    emailTemplates = module.get<EmailTemplatesService>(EmailTemplatesService);
    configService = module.get<ConfigService>(ConfigService);
    emailQueueService = module.get<EmailQueueService>(EmailQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const resetToken = 'abc123';

      jest.spyOn(emailQueueService, 'addPasswordResetEmailJob').mockResolvedValue(undefined);

      await service.sendPasswordResetEmail(userEmail, userName, resetToken);

      expect(emailQueueService.addPasswordResetEmailJob).toHaveBeenCalledWith(
        userEmail,
        userName,
        resetToken,
        30,
      );
    });

    it('should throw error when email queueing fails', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const resetToken = 'abc123';

      jest.spyOn(emailQueueService, 'addPasswordResetEmailJob').mockRejectedValue(new Error('Queue error'));

      await expect(service.sendPasswordResetEmail(userEmail, userName, resetToken)).rejects.toThrow(
        'Failed to queue password reset email: Queue error',
      );
    });
  });

  describe('sendMfaSetupEmail', () => {
    it('should send MFA setup email successfully', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const backupCodes = ['ABC123', 'DEF456'];

      jest.spyOn(emailQueueService, 'addMfaSetupEmailJob').mockResolvedValue(undefined);

      await service.sendMfaSetupEmail(userEmail, userName, backupCodes);

      expect(emailQueueService.addMfaSetupEmailJob).toHaveBeenCalledWith(
        userEmail,
        userName,
        backupCodes,
        undefined,
      );
    });

    it('should send MFA setup email with QR code successfully', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const backupCodes = ['ABC123', 'DEF456'];
      const qrCodeUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';

      jest.spyOn(emailQueueService, 'addMfaSetupEmailJob').mockResolvedValue(undefined);

      await service.sendMfaSetupEmail(userEmail, userName, backupCodes, qrCodeUrl);

      expect(emailQueueService.addMfaSetupEmailJob).toHaveBeenCalledWith(
        userEmail,
        userName,
        backupCodes,
        qrCodeUrl,
      );
    });
  });

  describe('sendMfaBackupCodesEmail', () => {
    it('should send MFA backup codes email successfully', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const backupCodes = ['XYZ789', 'DEF456'];

      jest.spyOn(emailQueueService, 'addMfaBackupCodesEmailJob').mockResolvedValue(undefined);

      await service.sendMfaBackupCodesEmail(userEmail, userName, backupCodes);

      expect(emailQueueService.addMfaBackupCodesEmailJob).toHaveBeenCalledWith(
        userEmail,
        userName,
        backupCodes,
      );
    });
  });

  describe('sendSecurityAlertEmail', () => {
    it('should send security alert email for password change', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const alertType = 'password_change' as const;
      const details = { timestamp: '2024-01-01 12:00:00' };

      jest.spyOn(emailClient, 'sendEmail').mockResolvedValue({
        messageId: 'test-message-id',
        provider: 'brevo',
        sentAt: new Date(),
        status: 'sent',
      });

      await service.sendSecurityAlertEmail(userEmail, userName, alertType, details);

      expect(emailClient.sendEmail).toHaveBeenCalledWith({
        to: userEmail,
        subject: 'Security Alert - Password Changed',
        htmlContent: expect.stringContaining('John Doe'),
        textContent: expect.stringContaining('John Doe'),
      });
    });

    it('should send security alert email for MFA disable', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const alertType = 'mfa_disable' as const;

      jest.spyOn(emailClient, 'sendEmail').mockResolvedValue({
        messageId: 'test-message-id',
        provider: 'brevo',
        sentAt: new Date(),
        status: 'sent',
      });

      await service.sendSecurityAlertEmail(userEmail, userName, alertType);

      expect(emailClient.sendEmail).toHaveBeenCalledWith({
        to: userEmail,
        subject: 'Security Alert - Two-Factor Authentication Disabled',
        htmlContent: expect.stringContaining('John Doe'),
        textContent: expect.stringContaining('John Doe'),
      });
    });

    it('should send security alert email for account lockout', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const alertType = 'account_lockout' as const;
      const details = { lockoutDuration: '15 minutes' };

      jest.spyOn(emailClient, 'sendEmail').mockResolvedValue({
        messageId: 'test-message-id',
        provider: 'brevo',
        sentAt: new Date(),
        status: 'sent',
      });

      await service.sendSecurityAlertEmail(userEmail, userName, alertType, details);

      expect(emailClient.sendEmail).toHaveBeenCalledWith({
        to: userEmail,
        subject: 'Security Alert - Account Temporarily Locked',
        htmlContent: expect.stringContaining('15 minutes'),
        textContent: expect.stringContaining('15 minutes'),
      });
    });
  });
}); 