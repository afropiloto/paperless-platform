import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EMAIL_CLIENT_SERVICE } from '../../email-client/email-client.constants';
import { EmailClientInterface } from '../../email-client/types';
import { EmailTemplatesService } from './email-templates.service';
import { AuthEmailService } from './auth-email.service';

describe('AuthEmailService', () => {
  let service: AuthEmailService;
  let emailClient: EmailClientInterface;
  let emailTemplates: EmailTemplatesService;
  let configService: ConfigService;

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
      ],
    }).compile();

    service = module.get<AuthEmailService>(AuthEmailService);
    emailClient = module.get<EmailClientInterface>(EMAIL_CLIENT_SERVICE);
    emailTemplates = module.get<EmailTemplatesService>(EmailTemplatesService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const resetToken = 'abc123';

      const emailContent = {
        subject: 'Reset Your Test App Password',
        htmlContent: '<html>Reset password</html>',
        textContent: 'Reset password',
      };

      jest.spyOn(emailTemplates, 'generatePasswordResetEmail').mockReturnValue(emailContent);
      jest.spyOn(emailClient, 'sendEmail').mockResolvedValue({
        messageId: 'test-message-id',
        provider: 'brevo',
        sentAt: new Date(),
        status: 'sent',
      });

      await service.sendPasswordResetEmail(userEmail, userName, resetToken);

      expect(emailTemplates.generatePasswordResetEmail).toHaveBeenCalledWith({
        userName,
        resetUrl: 'https://test.example.com/reset-password?token=abc123',
        expiryMinutes: 30,
      });
      expect(emailClient.sendEmail).toHaveBeenCalledWith({
        to: userEmail,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent,
      });
    });

    it('should throw error when email sending fails', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const resetToken = 'abc123';

      const emailContent = {
        subject: 'Reset Your Test App Password',
        htmlContent: '<html>Reset password</html>',
        textContent: 'Reset password',
      };

      jest.spyOn(emailTemplates, 'generatePasswordResetEmail').mockReturnValue(emailContent);
      jest.spyOn(emailClient, 'sendEmail').mockRejectedValue(new Error('Email service error'));

      await expect(service.sendPasswordResetEmail(userEmail, userName, resetToken)).rejects.toThrow(
        'Failed to send password reset email: Email service error',
      );
    });

    it('should throw error when email provider returns failed status', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const resetToken = 'abc123';

      const emailContent = {
        subject: 'Reset Your Test App Password',
        htmlContent: '<html>Reset password</html>',
        textContent: 'Reset password',
      };

      jest.spyOn(emailTemplates, 'generatePasswordResetEmail').mockReturnValue(emailContent);
      jest.spyOn(emailClient, 'sendEmail').mockResolvedValue({
        provider: 'brevo',
        sentAt: new Date(),
        status: 'failed',
        error: 'Provider error',
      });

      await expect(service.sendPasswordResetEmail(userEmail, userName, resetToken)).rejects.toThrow(
        'Failed to send password reset email: Provider error',
      );
    });
  });

  describe('sendMfaSetupEmail', () => {
    it('should send MFA setup email successfully', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const backupCodes = ['ABC123', 'DEF456'];

      const emailContent = {
        subject: 'Your Test App Backup Codes',
        htmlContent: '<html>Backup codes</html>',
        textContent: 'Backup codes',
      };

      jest.spyOn(emailTemplates, 'generateMfaSetupEmail').mockReturnValue(emailContent);
      jest.spyOn(emailClient, 'sendEmail').mockResolvedValue({
        messageId: 'test-message-id',
        provider: 'brevo',
        sentAt: new Date(),
        status: 'sent',
      });

      await service.sendMfaSetupEmail(userEmail, userName, backupCodes);

      expect(emailTemplates.generateMfaSetupEmail).toHaveBeenCalledWith({
        userName,
        backupCodes,
      });
      expect(emailClient.sendEmail).toHaveBeenCalledWith({
        to: userEmail,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent,
      });
    });

    it('should send MFA setup email with QR code successfully', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const backupCodes = ['ABC123', 'DEF456'];
      const qrCodeUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';

      const emailContent = {
        subject: 'Your Test App Two-Factor Authentication Setup',
        htmlContent: '<html>MFA setup with QR code</html>',
        textContent: 'MFA setup with QR code',
      };

      jest.spyOn(emailTemplates, 'generateMfaSetupEmail').mockReturnValue(emailContent);
      jest.spyOn(emailClient, 'sendEmail').mockResolvedValue({
        messageId: 'test-message-id',
        provider: 'brevo',
        sentAt: new Date(),
        status: 'sent',
      });

      await service.sendMfaSetupEmail(userEmail, userName, backupCodes, qrCodeUrl);

      expect(emailTemplates.generateMfaSetupEmail).toHaveBeenCalledWith({
        userName,
        backupCodes,
        qrCodeUrl,
      });
      expect(emailClient.sendEmail).toHaveBeenCalledWith({
        to: userEmail,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent,
      });
    });
  });

  describe('sendMfaBackupCodesEmail', () => {
    it('should send MFA backup codes email successfully', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const backupCodes = ['XYZ789', 'DEF456'];

      const emailContent = {
        subject: 'Your Test App Backup Codes Have Been Regenerated',
        htmlContent: '<html>New backup codes</html>',
        textContent: 'New backup codes',
      };

      jest.spyOn(emailTemplates, 'generateMfaBackupCodesEmail').mockReturnValue(emailContent);
      jest.spyOn(emailClient, 'sendEmail').mockResolvedValue({
        messageId: 'test-message-id',
        provider: 'brevo',
        sentAt: new Date(),
        status: 'sent',
      });

      await service.sendMfaBackupCodesEmail(userEmail, userName, backupCodes);

      expect(emailTemplates.generateMfaBackupCodesEmail).toHaveBeenCalledWith({
        userName,
        backupCodes,
      });
      expect(emailClient.sendEmail).toHaveBeenCalledWith({
        to: userEmail,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent,
      });
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