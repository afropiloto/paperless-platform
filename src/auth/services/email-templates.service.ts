import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expiryMinutes: number;
  supportEmail?: string;
}

export interface MfaSetupEmailData {
  userName: string;
  backupCodes: string[];
  qrCodeUrl?: string; // Add this field for QR code URL
  supportEmail?: string;
}

export interface MfaBackupCodesEmailData {
  userName: string;
  backupCodes: string[];
  supportEmail?: string;
}

export interface UserInvitationEmailData {
  userName: string;
  inviterName: string;
  loginUrl: string;
  temporaryPassword: string;
  supportEmail?: string;
  customMessage?: string;
}

export interface WelcomeEmailData {
  userName: string;
  loginUrl: string;
  supportEmail?: string;
}

export interface ForcePasswordResetEmailData {
  userName: string;
  reason?: string;
  supportEmail?: string;
}

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);
  private readonly appName: string;
  private readonly appUrl: string;
  private readonly supportEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.appName = this.configService.get<string>('app.name') || 'Trade Documents Platform';
    this.appUrl = this.configService.get<string>('app.url') || 'https://app.tradedocs.com';
    this.supportEmail = this.configService.get<string>('app.supportEmail') || 'support@tradedocs.com';
  }

  generatePasswordResetEmail(data: PasswordResetEmailData): { subject: string; htmlContent: string; textContent: string } {
    const subject = `Reset Your ${this.appName} Password`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e9ecef; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.appName}</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello ${data.userName},</p>
            <p>We received a request to reset your password for your ${this.appName} account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </p>
            <div class="warning">
              <strong>Important:</strong> This link will expire in ${data.expiryMinutes} minutes for security reasons.
            </div>
            <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <p>If you're having trouble with the button above, copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${data.resetUrl}</p>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact us at <a href="mailto:${data.supportEmail || this.supportEmail}">${data.supportEmail || this.supportEmail}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Reset Your ${this.appName} Password

Hello ${data.userName},

We received a request to reset your password for your ${this.appName} account.

Click the link below to reset your password:
${data.resetUrl}

Important: This link will expire in ${data.expiryMinutes} minutes for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

If you have any questions, please contact us at ${data.supportEmail || this.supportEmail}

© ${new Date().getFullYear()} ${this.appName}. All rights reserved.
    `;

    return { subject, htmlContent, textContent };
  }

  generateMfaSetupEmail(data: MfaSetupEmailData): { subject: string; htmlContent: string; textContent: string } {
    const subject = data.qrCodeUrl 
      ? `Your ${this.appName} Two-Factor Authentication Setup`
      : `Your ${this.appName} Backup Codes`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.qrCodeUrl ? 'Two-Factor Authentication Setup' : 'Your Backup Codes'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e9ecef; }
          .qr-code { text-align: center; margin: 20px 0; }
          .qr-code img { max-width: 200px; height: auto; }
          .codes { background: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; font-family: monospace; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.appName}</h1>
          </div>
          <div class="content">
            <h2>${data.qrCodeUrl ? 'Two-Factor Authentication Setup' : 'Your Two-Factor Authentication Backup Codes'}</h2>
            <p>Hello ${data.userName},</p>
            
            ${data.qrCodeUrl ? `
              <p>Two-factor authentication (2FA) has been enabled for your ${this.appName} account.</p>
              <p>To complete the setup, please scan the QR code below with your authenticator app:</p>
              <div class="qr-code">
                <img src="${data.qrCodeUrl}" alt="QR Code for MFA Setup" />
              </div>
              <p>After scanning the QR code, you'll need to verify the setup by entering a 6-digit code from your authenticator app when you next log in.</p>
            ` : `
              <p>You have successfully set up two-factor authentication (2FA) for your ${this.appName} account.</p>
            `}
            
            <p>Here are your backup codes. Please save them in a secure location:</p>
            <div class="codes">
              ${data.backupCodes.map(code => `<div>${code}</div>`).join('')}
            </div>
            <div class="warning">
              <strong>Important:</strong>
              <ul>
                <li>Keep these codes safe and secure</li>
                <li>Each code can only be used once</li>
                <li>Use these codes if you lose access to your authenticator app</li>
                <li>You can regenerate new codes from your account settings</li>
              </ul>
            </div>
            <p>If you didn't set up 2FA for your account, please contact us immediately.</p>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact us at <a href="mailto:${data.supportEmail || this.supportEmail}">${data.supportEmail || this.supportEmail}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
${data.qrCodeUrl ? `Your ${this.appName} Two-Factor Authentication Setup` : `Your ${this.appName} Two-Factor Authentication Backup Codes`}

Hello ${data.userName},

${data.qrCodeUrl ? `
Two-factor authentication (2FA) has been enabled for your ${this.appName} account.

To complete the setup, please scan the QR code in the HTML version of this email with your authenticator app.

After scanning the QR code, you'll need to verify the setup by entering a 6-digit code from your authenticator app when you next log in.
` : `
You have successfully set up two-factor authentication (2FA) for your ${this.appName} account.
`}

Here are your backup codes. Please save them in a secure location:

${data.backupCodes.join('\n')}

Important:
- Keep these codes safe and secure
- Each code can only be used once
- Use these codes if you lose access to your authenticator app
- You can regenerate new codes from your account settings

If you didn't set up 2FA for your account, please contact us immediately.

If you have any questions, please contact us at ${data.supportEmail || this.supportEmail}

© ${new Date().getFullYear()} ${this.appName}. All rights reserved.
    `;

    return { subject, htmlContent, textContent };
  }

  generateMfaBackupCodesEmail(data: MfaBackupCodesEmailData): { subject: string; htmlContent: string; textContent: string } {
    const subject = `Your ${this.appName} Backup Codes Have Been Regenerated`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Backup Codes</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e9ecef; }
          .codes { background: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; font-family: monospace; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.appName}</h1>
          </div>
          <div class="content">
            <h2>Your Backup Codes Have Been Regenerated</h2>
            <p>Hello ${data.userName},</p>
            <p>You have successfully regenerated your two-factor authentication backup codes for your ${this.appName} account.</p>
            <p>Here are your new backup codes:</p>
            <div class="codes">
              ${data.backupCodes.map(code => `<div>${code}</div>`).join('')}
            </div>
            <div class="warning">
              <strong>Important:</strong>
              <ul>
                <li>Your previous backup codes are no longer valid</li>
                <li>Keep these new codes safe and secure</li>
                <li>Each code can only be used once</li>
                <li>Use these codes if you lose access to your authenticator app</li>
              </ul>
            </div>
            <p>If you didn't regenerate these codes, please contact us immediately.</p>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact us at <a href="mailto:${data.supportEmail || this.supportEmail}">${data.supportEmail || this.supportEmail}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Your ${this.appName} Backup Codes Have Been Regenerated

Hello ${data.userName},

You have successfully regenerated your two-factor authentication backup codes for your ${this.appName} account.

Here are your new backup codes:

${data.backupCodes.join('\n')}

Important:
- Your previous backup codes are no longer valid
- Keep these new codes safe and secure
- Each code can only be used once
- Use these codes if you lose access to your authenticator app

If you didn't regenerate these codes, please contact us immediately.

If you have any questions, please contact us at ${data.supportEmail || this.supportEmail}

© ${new Date().getFullYear()} ${this.appName}. All rights reserved.
    `;

    return { subject, htmlContent, textContent };
  }

  generateUserInvitationEmail(data: UserInvitationEmailData): { subject: string; htmlContent: string; textContent: string } {
    this.logger.debug({data})
    const subject = `Welcome to ${this.appName} - Your Account is Ready`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${this.appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e9ecef; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .credentials { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.appName}</h1>
          </div>
          <div class="content">
            <h2>Welcome to ${this.appName}!</h2>
            <p>Hello ${data.userName},</p>
            <p>You have been invited by <strong>${data.inviterName}</strong> to join ${this.appName}.</p>
            ${data.customMessage ? `<p><em>${data.customMessage}</em></p>` : ''}
            <p>Your account has been created and is ready to use. Here are your login credentials:</p>
            <div class="credentials">
              <strong>Login URL:</strong> ${data.loginUrl}<br>
              <strong>Email:</strong> Your email address<br>
              <strong>Temporary Password:</strong> ${data.temporaryPassword}
            </div>
            <p style="text-align: center;">
              <a href="${data.loginUrl}" class="button">Login to Your Account</a>
            </p>
            <div class="warning">
              <strong>Important:</strong>
              <ul>
                <li>Please change your password on your first login</li>
                <li>Set up two-factor authentication for enhanced security</li>
                <li>Keep your login credentials secure</li>
              </ul>
            </div>
            <p>If you have any questions or need assistance, please contact us at <a href="mailto:${data.supportEmail || this.supportEmail}">${data.supportEmail || this.supportEmail}</a>.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to ${this.appName}!

Hello ${data.userName},

You have been invited by ${data.inviterName} to join ${this.appName}.

${data.customMessage ? `${data.customMessage}\n\n` : ''}Your account has been created and is ready to use. Here are your login credentials:

Login URL: ${data.loginUrl}
Email: Your email address
Temporary Password: ${data.temporaryPassword}

Important:
- Please change your password on your first login
- Set up two-factor authentication for enhanced security
- Keep your login credentials secure

If you have any questions or need assistance, please contact us at ${data.supportEmail || this.supportEmail}

© ${new Date().getFullYear()} ${this.appName}. All rights reserved.
    `;

    return { subject, htmlContent, textContent };
  }

  generateWelcomeEmail(data: WelcomeEmailData): { subject: string; htmlContent: string; textContent: string } {
    const subject = `Welcome to ${this.appName} - Your Account is Active`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${this.appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e9ecef; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.appName}</h1>
          </div>
          <div class="content">
            <h2>Welcome to ${this.appName}!</h2>
            <p>Hello ${data.userName},</p>
            <p>Welcome to ${this.appName}! Your account is now active and ready to use.</p>
            <p>You can now access all the features and services available to you based on your permissions.</p>
            <p style="text-align: center;">
              <a href="${data.loginUrl}" class="button">Access Your Account</a>
            </p>
            <p>If you have any questions or need assistance, please contact us at <a href="mailto:${data.supportEmail || this.supportEmail}">${data.supportEmail || this.supportEmail}</a>.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to ${this.appName}!

Hello ${data.userName},

Welcome to ${this.appName}! Your account is now active and ready to use.

You can now access all the features and services available to you based on your permissions.

Access your account at: ${data.loginUrl}

If you have any questions or need assistance, please contact us at ${data.supportEmail || this.supportEmail}

© ${new Date().getFullYear()} ${this.appName}. All rights reserved.
    `;

    return { subject, htmlContent, textContent };
  }

  generateForcePasswordResetEmail(data: ForcePasswordResetEmailData): { subject: string; htmlContent: string; textContent: string } {
    const subject = `Password Reset Required - ${this.appName}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Required</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e9ecef; }
          .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
          .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; margin: 20px 0; color: #721c24; }
          .reason { background: #e2e3e5; border: 1px solid #d6d8db; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.appName}</h1>
          </div>
          <div class="content">
            <h2>Password Reset Required</h2>
            <p>Hello ${data.userName},</p>
            <p>Your password has been reset by an administrator. You will need to set a new password the next time you log in to your ${this.appName} account.</p>
            
            <div class="warning">
              <strong>Important:</strong> You will not be able to access your account until you set a new password.
            </div>
            
            ${data.reason ? `
            <div class="reason">
              <strong>Reason for reset:</strong> ${data.reason}
            </div>
            ` : `
            <div class="reason">
              <strong>Reason for reset:</strong> No reason provided
            </div>
            `}
            
            <p>When you next attempt to log in, you will be prompted to create a new password. Please ensure your new password meets our security requirements:</p>
            <ul>
              <li>At least 8 characters long</li>
              <li>Contains at least one uppercase letter</li>
              <li>Contains at least one lowercase letter</li>
              <li>Contains at least one number</li>
              <li>Contains at least one special character</li>
            </ul>
            
            <p>If you have any questions about this password reset or need assistance, please contact us at <a href="mailto:${data.supportEmail || this.supportEmail}">${data.supportEmail || this.supportEmail}</a>.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Password Reset Required - ${this.appName}

Hello ${data.userName},

Your password has been reset by an administrator. You will need to set a new password the next time you log in to your ${this.appName} account.

IMPORTANT: You will not be able to access your account until you set a new password.

Reason for reset: ${data.reason || 'No reason provided'}

When you next attempt to log in, you will be prompted to create a new password. Please ensure your new password meets our security requirements:

- At least 8 characters long
- Contains at least one uppercase letter
- Contains at least one lowercase letter
- Contains at least one number
- Contains at least one special character

If you have any questions about this password reset or need assistance, please contact us at ${data.supportEmail || this.supportEmail}

© ${new Date().getFullYear()} ${this.appName}. All rights reserved.
    `;

    return { subject, htmlContent, textContent };
  }
} 