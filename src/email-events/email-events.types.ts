import { EmailJobType } from '../constants/app.constants';

// Base email job data interface
export interface BaseEmailJobData {
  jobType: EmailJobType;
  to: string | string[];
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  metadata?: Record<string, any>;
}

// Email attachment interface
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

// Password reset email job data
export interface PasswordResetEmailJobData extends BaseEmailJobData {
  jobType: EmailJobType.PASSWORD_RESET;
  userName: string;
  resetToken: string;
  expiryMinutes: number;
}

// Welcome email job data
export interface WelcomeEmailJobData extends BaseEmailJobData {
  jobType: EmailJobType.WELCOME_EMAIL;
  userName: string;
}

// User invitation email job data
export interface UserInvitationEmailJobData extends BaseEmailJobData {
  jobType: EmailJobType.USER_INVITATION;
  userName: string;
  inviterName: string;
  temporaryPassword: string;
  customMessage?: string;
}

// MFA setup email job data
export interface MfaSetupEmailJobData extends BaseEmailJobData {
  jobType: EmailJobType.MFA_SETUP;
  userName: string;
  backupCodes: string[];
  qrCodeUrl?: string;
}

// MFA backup codes email job data
export interface MfaBackupCodesEmailJobData extends BaseEmailJobData {
  jobType: EmailJobType.MFA_BACKUP_CODES;
  userName: string;
  backupCodes: string[];
}

// Force password reset email job data
export interface ForcePasswordResetEmailJobData extends BaseEmailJobData {
  jobType: EmailJobType.FORCE_PASSWORD_RESET;
  userName: string;
  reason?: string;
}

// Union type for all email job data
export type EmailJobData = 
  | PasswordResetEmailJobData
  | WelcomeEmailJobData
  | UserInvitationEmailJobData
  | MfaSetupEmailJobData
  | MfaBackupCodesEmailJobData
  | ForcePasswordResetEmailJobData;

// Email job result
export interface EmailJobResult {
  messageId?: string;
  provider: string;
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string;
  retryCount?: number;
}
