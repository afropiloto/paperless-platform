import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_CLIENT_SERVICE } from '../../email-client/email-client.constants';
import { EmailClientInterface } from '../../email-client/types';
import { EmailTemplatesService, PasswordResetEmailData, MfaSetupEmailData, MfaBackupCodesEmailData, UserInvitationEmailData, WelcomeEmailData } from './email-templates.service';
import { EmailQueueService } from '../../email-events/email-queue.service';

@Injectable()
export class AuthEmailService {
  private readonly logger = new Logger(AuthEmailService.name);
  private readonly appUrl: string;
  private readonly passwordResetExpiryMinutes: number;

  constructor(
    @Inject(EMAIL_CLIENT_SERVICE)
    private readonly emailClient: EmailClientInterface,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly configService: ConfigService,
    private readonly emailQueueService: EmailQueueService,
  ) {
    this.appUrl = this.configService.get<string>('app.url') || 'http://localhost:3001';
    this.passwordResetExpiryMinutes = this.configService.get<number>('auth.passwordReset.expiryMinutes') || 30;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string,
  ): Promise<void> {
    try {
      await this.emailQueueService.addPasswordResetEmailJob(
        userEmail,
        userName,
        resetToken,
        this.passwordResetExpiryMinutes,
      );

      this.logger.log(`Password reset email queued for ${userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to queue password reset email for ${userEmail}:`, error);
      throw new Error(`Failed to queue password reset email: ${error.message}`);
    }
  }

  /**
   * Send MFA setup notification email with backup codes and optional QR code
   */
  async sendMfaSetupEmail(
    userEmail: string,
    userName: string,
    backupCodes: string[],
    qrCodeUrl?: string, // Add this parameter for QR code URL
  ): Promise<void> {
    try {
      await this.emailQueueService.addMfaSetupEmailJob(
        userEmail,
        userName,
        backupCodes,
        qrCodeUrl,
      );

      this.logger.log(`MFA setup email queued for ${userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to queue MFA setup email for ${userEmail}:`, error);
      throw new Error(`Failed to queue MFA setup email: ${error.message}`);
    }
  }

  /**
   * Send MFA backup codes regeneration email
   */
  async sendMfaBackupCodesEmail(
    userEmail: string,
    userName: string,
    backupCodes: string[],
  ): Promise<void> {
    try {
      await this.emailQueueService.addMfaBackupCodesEmailJob(
        userEmail,
        userName,
        backupCodes,
      );

      this.logger.log(`MFA backup codes email queued for ${userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to queue MFA backup codes email for ${userEmail}:`, error);
      throw new Error(`Failed to queue MFA backup codes email: ${error.message}`);
    }
  }

  /**
   * Send security alert email for suspicious activity
   */
  async sendSecurityAlertEmail(
    userEmail: string,
    userName: string,
    alertType: 'login_attempt' | 'password_change' | 'mfa_disable' | 'account_lockout',
    details?: Record<string, any>,
  ): Promise<void> {
    try {
      const subject = `Security Alert - ${this.getAlertSubject(alertType)}`;
      
      const htmlContent = this.generateSecurityAlertHtml(userName, alertType, details);
      const textContent = this.generateSecurityAlertText(userName, alertType, details);

      const result = await this.emailClient.sendEmail({
        to: userEmail,
        subject,
        htmlContent,
        textContent,
      });

      if (result.status === 'sent') {
        this.logger.log(`Security alert email sent to ${userEmail} for ${alertType} with message ID: ${result.messageId}`);
      } else {
        throw new Error(`Failed to send security alert email: ${result.error}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send security alert email to ${userEmail}:`, error);
      throw new Error(`Failed to send security alert email: ${error.message}`);
    }
  }

  private getAlertSubject(alertType: string): string {
    const subjects = {
      login_attempt: 'New Login Attempt',
      password_change: 'Password Changed',
      mfa_disable: 'Two-Factor Authentication Disabled',
      account_lockout: 'Account Temporarily Locked',
    };
    return subjects[alertType] || 'Security Alert';
  }

  private generateSecurityAlertHtml(
    userName: string,
    alertType: string,
    details?: Record<string, any>,
  ): string {
    const appName = this.configService.get<string>('app.name') || 'Trade Documents Platform';
    const supportEmail = this.configService.get<string>('app.supportEmail') || 'support@tradedocs.com';

    const alertMessages = {
      login_attempt: `
        <p>We detected a new login attempt to your ${appName} account.</p>
        <p><strong>Time:</strong> ${details?.timestamp || new Date().toLocaleString()}</p>
        <p><strong>Location:</strong> ${details?.location || 'Unknown'}</p>
        <p><strong>Device:</strong> ${details?.device || 'Unknown'}</p>
      `,
      password_change: `
        <p>Your ${appName} account password was recently changed.</p>
        <p><strong>Time:</strong> ${details?.timestamp || new Date().toLocaleString()}</p>
        <p>If you didn't make this change, please contact us immediately.</p>
      `,
      mfa_disable: `
        <p>Two-factor authentication was disabled for your ${appName} account.</p>
        <p><strong>Time:</strong> ${details?.timestamp || new Date().toLocaleString()}</p>
        <p>If you didn't disable 2FA, please contact us immediately.</p>
      `,
      account_lockout: `
        <p>Your ${appName} account has been temporarily locked due to multiple failed login attempts.</p>
        <p><strong>Lockout Duration:</strong> ${details?.lockoutDuration || '15 minutes'}</p>
        <p>You can try logging in again after the lockout period expires.</p>
      `,
    };

    const message = alertMessages[alertType] || '<p>A security event occurred on your account.</p>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e9ecef; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Security Alert</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            ${message}
            <div class="warning">
              <strong>If you didn't perform this action, please:</strong>
              <ul>
                <li>Change your password immediately</li>
                <li>Enable two-factor authentication if not already enabled</li>
                <li>Contact our support team</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateSecurityAlertText(
    userName: string,
    alertType: string,
    details?: Record<string, any>,
  ): string {
    const appName = this.configService.get<string>('app.name') || 'Trade Documents Platform';
    const supportEmail = this.configService.get<string>('app.supportEmail') || 'support@tradedocs.com';

    const alertMessages = {
      login_attempt: `
We detected a new login attempt to your ${appName} account.

Time: ${details?.timestamp || new Date().toLocaleString()}
Location: ${details?.location || 'Unknown'}
Device: ${details?.device || 'Unknown'}
      `,
      password_change: `
Your ${appName} account password was recently changed.

Time: ${details?.timestamp || new Date().toLocaleString()}

If you didn't make this change, please contact us immediately.
      `,
      mfa_disable: `
Two-factor authentication was disabled for your ${appName} account.

Time: ${details?.timestamp || new Date().toLocaleString()}

If you didn't disable 2FA, please contact us immediately.
      `,
      account_lockout: `
Your ${appName} account has been temporarily locked due to multiple failed login attempts.

Lockout Duration: ${details?.lockoutDuration || '15 minutes'}

You can try logging in again after the lockout period expires.
      `,
    };

    const message = alertMessages[alertType] || 'A security event occurred on your account.';

    return `
SECURITY ALERT

Hello ${userName},

${message}

If you didn't perform this action, please:
- Change your password immediately
- Enable two-factor authentication if not already enabled
- Contact our support team

If you have any questions, please contact us at ${supportEmail}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `;
  }

  /**
   * Send user invitation email with temporary password
   */
  async sendUserInvitationEmail(
    userEmail: string,
    userName: string,
    inviterName: string,
    temporaryPassword: string,
    customMessage?: string,
  ): Promise<void> {
    try {
      await this.emailQueueService.addUserInvitationEmailJob(
        userEmail,
        userName,
        inviterName,
        temporaryPassword,
        customMessage,
      );

      this.logger.log(`User invitation email queued for ${userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to queue user invitation email for ${userEmail}:`, error);
      throw new Error(`Failed to queue user invitation email: ${error.message}`);
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
  ): Promise<void> {
    try {
      await this.emailQueueService.addWelcomeEmailJob(
        userEmail,
        userName,
      );

      this.logger.log(`Welcome email queued for ${userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to queue welcome email for ${userEmail}:`, error);
      throw new Error(`Failed to queue welcome email: ${error.message}`);
    }
  }
} 