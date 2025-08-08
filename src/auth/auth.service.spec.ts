import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SiweService } from '../siwe/siwe.service';
import { AccountUsersService } from '../account-users/account-users.service';
import { AccountsService } from '../accounts/accounts.service';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from './services/password.service';
import { MfaService } from './services/mfa.service';
import { AuthEmailService } from './services/auth-email.service';
import { EmailPasswordLoginDto } from './dtos/email-password-login.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let siweService: SiweService;
  let accountUsersService: AccountUsersService;
  let accountsService: AccountsService;
  let auditService: AuditService;
  let passwordService: PasswordService;
  let mfaService: MfaService;
  let authEmailService: AuthEmailService;
  let configService: ConfigService;

  const mockUser = {
    id: 'user123',
    accountId: 'account123',
    name: 'Test User',
    emailAddress: 'test@example.com',
    walletAddress: '0x1234567890abcdef',
    status: 'Active',
    permissions: [{ module: 'DealDesk', role: 'Agent' }],
    passwordHash: '$2b$12$test.hash.here',
    failedLoginAttempts: 0,
    accountLockedUntil: undefined,
    authMethod: 'email-password',
    mfaEnabled: false,
  };

  const mockAccount = {
    id: 'account123',
    accountName: 'Test Account',
    contact: { emailAddress: 'account@example.com' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
            verify: jest.fn().mockReturnValue({ userId: 'user123' }),
          },
        },
        {
          provide: SiweService,
          useValue: {
            verifyMessage: jest.fn().mockResolvedValue('0x1234567890abcdef'),
          },
        },
        {
          provide: AccountUsersService,
          useValue: {
            findAccountUserByEmail: jest.fn(),
            findAccountUserByEmailForAuth: jest.fn(),
            findAccountUserByWalletAddress: jest.fn(),
            getAccountUserById: jest.fn(),
            updateAccountUser: jest.fn(),
          },
        },
        {
          provide: AccountsService,
          useValue: {
            findByWalletAddress: jest.fn(),
            findByAccountId: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            comparePassword: jest.fn(),
            hashPassword: jest.fn(),
            validatePassword: jest.fn(),
          },
        },
        {
          provide: MfaService,
          useValue: {
            isMfaGloballyEnabled: jest.fn(),
            isMfaRequired: jest.fn(),
            setupMfa: jest.fn(),
            verifyMfa: jest.fn(),
            generateBackupCodes: jest.fn(),
          },
        },
        {
          provide: AuthEmailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
            sendMfaSetupEmail: jest.fn(),
            sendMfaBackupCodesEmail: jest.fn(),
            sendSecurityAlertEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'jwt.expiresIn': '15m',
                'refreshToken.expiresIn': '7d',
                'auth.accountLockout.maxFailedAttempts': 5,
                'auth.accountLockout.lockoutDuration': 15,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    siweService = module.get<SiweService>(SiweService);
    accountUsersService = module.get<AccountUsersService>(AccountUsersService);
    accountsService = module.get<AccountsService>(AccountsService);
    auditService = module.get<AuditService>(AuditService);
    passwordService = module.get<PasswordService>(PasswordService);
    mfaService = module.get<MfaService>(MfaService);
    authEmailService = module.get<AuthEmailService>(AuthEmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loginWithEmailPassword', () => {
    const loginDto: EmailPasswordLoginDto = {
      email: 'test@example.com',
      password: 'ValidPassword123!',
    };

    it('should successfully authenticate with valid credentials', async () => {
      jest.spyOn(accountUsersService, 'findAccountUserByEmailForAuth').mockResolvedValue(mockUser as any);
      jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(accountsService, 'findByAccountId').mockResolvedValue(mockAccount as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock.jwt.token');
      jest.spyOn(mfaService, 'isMfaRequired').mockResolvedValue(false);

      const result = await service.loginWithEmailPassword(loginDto);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toBe('mock.jwt.token');
      expect(result.userEmail).toBe('test@example.com');
      expect(auditService.log).toHaveBeenCalledWith({
        subject: AuditSubject.AUTHENTICATION,
        eventType: AuditEventType.LOGIN_SUCCESSFUL,
        identifier: 'account123',
        details: { accountName: 'Test Account', userEmail: 'test@example.com' },
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      jest.spyOn(accountUsersService, 'findAccountUserByEmailForAuth').mockResolvedValue(null);

      await expect(service.loginWithEmailPassword(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for locked account', async () => {
      const lockedUser = { ...mockUser, accountLockedUntil: new Date(Date.now() + 60000) };
      jest.spyOn(accountUsersService, 'findAccountUserByEmailForAuth').mockResolvedValue(lockedUser as any);

      await expect(service.loginWithEmailPassword(loginDto)).rejects.toThrow(
        'Account is locked. Please try again later.',
      );
    });

    it('should increment failed login attempts and lock account after max attempts', async () => {
      const userWithFailedAttempts = { ...mockUser, failedLoginAttempts: 4 };
      jest.spyOn(accountUsersService, 'findAccountUserByEmailForAuth').mockResolvedValue(userWithFailedAttempts as any);
      jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(false);
      jest.spyOn(accountUsersService, 'updateAccountUser').mockResolvedValue(mockUser as any);

      await expect(service.loginWithEmailPassword(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(accountUsersService.updateAccountUser).toHaveBeenCalledWith('user123', {
        failedLoginAttempts: 5,
        accountLockedUntil: expect.any(Date),
      });
      expect(auditService.log).toHaveBeenCalledWith({
        subject: AuditSubject.AUTHENTICATION,
        eventType: AuditEventType.LOGIN_FAILED,
        identifier: 'account123',
        details: { reason: 'Account locked after failed attempts', userEmail: 'test@example.com' },
      });
    });

    it('should reset failed login attempts on successful login', async () => {
      const userWithFailedAttempts = { ...mockUser, failedLoginAttempts: 2 };
      jest.spyOn(accountUsersService, 'findAccountUserByEmailForAuth').mockResolvedValue(userWithFailedAttempts as any);
      jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(accountsService, 'findByAccountId').mockResolvedValue(mockAccount as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock.jwt.token');
      jest.spyOn(mfaService, 'isMfaRequired').mockResolvedValue(false);

      await service.loginWithEmailPassword(loginDto);

      expect(accountUsersService.updateAccountUser).toHaveBeenCalledWith('user123', {
        failedLoginAttempts: 0,
        accountLockedUntil: undefined,
      });
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword456!',
    };

    it('should successfully change password with valid credentials', async () => {
      jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(mockUser as any);
      jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(passwordService, 'validatePassword').mockReturnValue({ isValid: true, errors: [] });
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('new.hash.here');
      jest.spyOn(accountUsersService, 'updateAccountUser').mockResolvedValue(mockUser as any);

      const result = await service.changePassword('user123', changePasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
      expect(accountUsersService.updateAccountUser).toHaveBeenCalledWith('user123', {
        passwordHash: 'new.hash.here',
        passwordChanged: true,
      });
              expect(auditService.log).toHaveBeenCalledWith({
          subject: AuditSubject.AUTHENTICATION,
          eventType: AuditEventType.PASSWORD_CHANGED,
          identifier: 'account123',
          details: { userEmail: 'test@example.com' },
        });
        expect(authEmailService.sendSecurityAlertEmail).toHaveBeenCalledWith(
          'test@example.com',
          'Test User',
          'password_change',
          { timestamp: expect.any(String) },
        );
    });

    it('should throw UnauthorizedException for incorrect current password', async () => {
      jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(mockUser as any);
      jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(false);

      await expect(service.changePassword('user123', changePasswordDto)).rejects.toThrow(
        'Current password is incorrect',
      );
    });

    it('should throw UnauthorizedException for invalid new password', async () => {
      jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(mockUser as any);
      jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(passwordService, 'validatePassword').mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters long'],
      });

      await expect(service.changePassword('user123', changePasswordDto)).rejects.toThrow(
        'New password does not meet policy: Password must be at least 8 characters long',
      );
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should return success message for existing user and send email', async () => {
      jest.spyOn(accountUsersService, 'findAccountUserByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(authEmailService, 'sendPasswordResetEmail').mockResolvedValue(undefined);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('If the email exists, a reset link will be sent.');
      expect(authEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        expect.any(String), // token
      );
    });

    it('should return same message for non-existent user (security)', async () => {
      jest.spyOn(accountUsersService, 'findAccountUserByEmail').mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('If the email exists, a reset link will be sent.');
    });

    it('should handle email sending failure gracefully', async () => {
      jest.spyOn(accountUsersService, 'findAccountUserByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(authEmailService, 'sendPasswordResetEmail').mockRejectedValue(new Error('Email service error'));

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('If the email exists, a reset link will be sent.');
      expect(authEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'valid-token-123',
      newPassword: 'NewPassword456!',
    };

    it('should successfully reset password with valid token', async () => {
      // Set up the token in the service's in-memory map
      (service as any).passwordResetTokens.set('valid-token-123', {
        userId: 'user123',
        expiresAt: new Date(Date.now() + 60000), // 1 minute from now
      });

      jest.spyOn(passwordService, 'validatePassword').mockReturnValue({ isValid: true, errors: [] });
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('new.hash.here');
      jest.spyOn(accountUsersService, 'updateAccountUser').mockResolvedValue(mockUser as any);
      jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(mockUser as any);

      const result = await service.resetPassword(resetPasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password has been reset successfully');
      expect(accountUsersService.updateAccountUser).toHaveBeenCalledWith('user123', {
        passwordHash: 'new.hash.here',
        passwordChanged: true,
        failedLoginAttempts: 0,
        accountLockedUntil: undefined,
      });
      expect(auditService.log).toHaveBeenCalledWith({
        subject: AuditSubject.AUTHENTICATION,
        eventType: AuditEventType.PASSWORD_RESET,
        identifier: 'account123',
        details: { userEmail: 'test@example.com' },
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      (service as any).passwordResetTokens.set('expired-token', {
        userId: 'user123',
        expiresAt: new Date(Date.now() - 60000), // 1 minute ago
      });

      await expect(service.resetPassword({ ...resetPasswordDto, token: 'expired-token' })).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should throw UnauthorizedException for invalid new password', async () => {
      (service as any).passwordResetTokens.set('valid-token-123', {
        userId: 'user123',
        expiresAt: new Date(Date.now() + 60000),
      });

      jest.spyOn(passwordService, 'validatePassword').mockReturnValue({
        isValid: false,
        errors: ['Password must contain at least one uppercase letter'],
      });

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'New password does not meet policy: Password must contain at least one uppercase letter',
      );
    });
  });

  describe('MFA Methods', () => {
    describe('setupMfa', () => {
      it('should setup MFA for user', async () => {
        const mfaSetupResponse = {
          secret: 'JBSWY3DPEHPK3PXP',
          qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          backupCodes: ['ABC123', 'DEF456', 'GHI789'],
        };
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(mockUser as any);
        jest.spyOn(mfaService, 'setupMfa').mockResolvedValue(mfaSetupResponse);
        jest.spyOn(accountUsersService, 'updateAccountUser').mockResolvedValue(mockUser as any);

        const result = await service.setupMfa('user123');

        expect(result.success).toBe(true);
        expect(result.qrCodeUrl).toBe(mfaSetupResponse.qrCodeUrl);
        expect(result.secret).toBe(mfaSetupResponse.secret);
        expect(result.backupCodes).toEqual(mfaSetupResponse.backupCodes);
        expect(result.requiresVerification).toBe(true);
        expect(accountUsersService.updateAccountUser).toHaveBeenCalledWith('user123', {
          mfaSecret: mfaSetupResponse.secret,
          mfaBackupCodes: mfaSetupResponse.backupCodes,
          mfaEnabled: false,
        });
        expect(auditService.log).toHaveBeenCalledWith({
          subject: AuditSubject.AUTHENTICATION,
          eventType: AuditEventType.MFA_SETUP_INITIATED,
          identifier: 'account123',
          details: { userEmail: 'test@example.com' },
        });
        expect(authEmailService.sendMfaSetupEmail).toHaveBeenCalledWith(
          'test@example.com',
          'Test User',
          mfaSetupResponse.backupCodes,
          mfaSetupResponse.qrCodeUrl,
        );
      });

      it('should throw error if user not found', async () => {
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(null);

        await expect(service.setupMfa('nonexistent')).rejects.toThrow('User not found');
      });

      it('should throw error if MFA already enabled', async () => {
        const userWithMfa = { ...mockUser, mfaEnabled: true };
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(userWithMfa as any);

        await expect(service.setupMfa('user123')).rejects.toThrow('MFA is already enabled for this user');
      });
    });

    describe('verifyMfaSetup', () => {
      it('should verify MFA setup and enable MFA', async () => {
        const userWithMfaSecret = { ...mockUser, mfaSecret: 'JBSWY3DPEHPK3PXP', mfaBackupCodes: ['ABC123'] };
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(userWithMfaSecret as any);
        jest.spyOn(mfaService, 'verifyMfa').mockReturnValue({ isValid: true, isBackupCode: false });
        jest.spyOn(accountUsersService, 'updateAccountUser').mockResolvedValue(mockUser as any);

        const result = await service.verifyMfaSetup('user123', '123456');

        expect(result.success).toBe(true);
        expect(result.message).toBe('MFA setup completed successfully');
        expect(accountUsersService.updateAccountUser).toHaveBeenCalledWith('user123', {
          mfaEnabled: true,
          mfaSetupCompleted: expect.any(Date),
        });
        expect(auditService.log).toHaveBeenCalledWith({
          subject: AuditSubject.AUTHENTICATION,
          eventType: AuditEventType.MFA_SETUP_COMPLETED,
          identifier: 'account123',
          details: { userEmail: 'test@example.com' },
        });
      });

      it('should throw error if MFA setup not initiated', async () => {
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(mockUser as any);

        await expect(service.verifyMfaSetup('user123', '123456')).rejects.toThrow('MFA setup not initiated');
      });

      it('should throw error if invalid TOTP code', async () => {
        const userWithMfaSecret = { ...mockUser, mfaSecret: 'JBSWY3DPEHPK3PXP', mfaBackupCodes: ['ABC123'] };
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(userWithMfaSecret as any);
        jest.spyOn(mfaService, 'verifyMfa').mockReturnValue({ isValid: false, isBackupCode: false });

        await expect(service.verifyMfaSetup('user123', '123456')).rejects.toThrow('Invalid TOTP code');
      });
    });

    describe('verifyMfa', () => {
      it('should verify MFA and return tokens', async () => {
        const userWithMfa = { ...mockUser, mfaEnabled: true, mfaSecret: 'JBSWY3DPEHPK3PXP', mfaBackupCodes: ['ABC123'] };
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(userWithMfa as any);
        jest.spyOn(mfaService, 'verifyMfa').mockReturnValue({ isValid: true, isBackupCode: false });
        jest.spyOn(jwtService, 'sign').mockReturnValue('mock.jwt.token');

        const result = await service.verifyMfa('user123', '123456');

        expect(result.success).toBe(true);
        expect(result.accessToken).toBe('mock.jwt.token');
        expect(result.refreshToken).toBe('mock.jwt.token');
        expect(auditService.log).toHaveBeenCalledWith({
          subject: AuditSubject.AUTHENTICATION,
          eventType: AuditEventType.MFA_VERIFICATION_SUCCESSFUL,
          identifier: 'account123',
          details: { userEmail: 'test@example.com' },
        });
      });

      it('should throw error if MFA not enabled', async () => {
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(mockUser as any);

        await expect(service.verifyMfa('user123', '123456')).rejects.toThrow('MFA is not enabled for this user');
      });

      it('should throw error if invalid MFA code', async () => {
        const userWithMfa = { ...mockUser, mfaEnabled: true, mfaSecret: 'JBSWY3DPEHPK3PXP', mfaBackupCodes: ['ABC123'] };
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(userWithMfa as any);
        jest.spyOn(mfaService, 'verifyMfa').mockReturnValue({ isValid: false, isBackupCode: false });

        await expect(service.verifyMfa('user123', '123456')).rejects.toThrow('Invalid MFA code');
        expect(auditService.log).toHaveBeenCalledWith({
          subject: AuditSubject.AUTHENTICATION,
          eventType: AuditEventType.MFA_VERIFICATION_FAILED,
          identifier: 'account123',
          details: { userEmail: 'test@example.com', reason: 'Invalid MFA code' },
        });
      });
    });

    describe('disableMfa', () => {
      it('should disable MFA for user', async () => {
        const userWithMfa = { ...mockUser, mfaEnabled: true, mfaSecret: 'JBSWY3DPEHPK3PXP', mfaBackupCodes: ['ABC123'] };
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(userWithMfa as any);
        jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(true);
        jest.spyOn(mfaService, 'verifyMfa').mockReturnValue({ isValid: true, isBackupCode: false });
        jest.spyOn(accountUsersService, 'updateAccountUser').mockResolvedValue(mockUser as any);

        const result = await service.disableMfa('user123', 'CurrentPassword123!', '123456');

        expect(result.success).toBe(true);
        expect(result.message).toBe('MFA has been disabled successfully');
        expect(accountUsersService.updateAccountUser).toHaveBeenCalledWith('user123', {
          mfaEnabled: false,
          mfaSecret: undefined,
          mfaBackupCodes: undefined,
          mfaSetupCompleted: undefined,
        });
        expect(auditService.log).toHaveBeenCalledWith({
          subject: AuditSubject.AUTHENTICATION,
          eventType: AuditEventType.MFA_DISABLED,
          identifier: 'account123',
          details: { userEmail: 'test@example.com' },
        });
        expect(authEmailService.sendSecurityAlertEmail).toHaveBeenCalledWith(
          'test@example.com',
          'Test User',
          'mfa_disable',
          { timestamp: expect.any(String) },
        );
      });

      it('should throw error if current password incorrect', async () => {
        const userWithMfa = { ...mockUser, mfaEnabled: true, mfaSecret: 'JBSWY3DPEHPK3PXP', mfaBackupCodes: ['ABC123'] };
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(userWithMfa as any);
        jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(false);

        await expect(service.disableMfa('user123', 'WrongPassword123!', '123456')).rejects.toThrow('Current password is incorrect');
      });
    });

    describe('regenerateBackupCodes', () => {
      it('should regenerate backup codes', async () => {
        const userWithMfa = { ...mockUser, mfaEnabled: true, mfaSecret: 'JBSWY3DPEHPK3PXP', mfaBackupCodes: ['ABC123'] };
        const newBackupCodes = ['XYZ789', 'DEF456', 'GHI123'];
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(userWithMfa as any);
        jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(true);
        jest.spyOn(mfaService, 'verifyMfa').mockReturnValue({ isValid: true, isBackupCode: false });
        jest.spyOn(mfaService, 'generateBackupCodes').mockReturnValue(newBackupCodes);
        jest.spyOn(accountUsersService, 'updateAccountUser').mockResolvedValue(mockUser as any);

        const result = await service.regenerateBackupCodes('user123', 'CurrentPassword123!', '123456');

        expect(result.success).toBe(true);
        expect(result.backupCodes).toEqual(newBackupCodes);
        expect(result.warning).toBe('Previous backup codes are no longer valid');
        expect(accountUsersService.updateAccountUser).toHaveBeenCalledWith('user123', {
          mfaBackupCodes: newBackupCodes,
        });
        expect(auditService.log).toHaveBeenCalledWith({
          subject: AuditSubject.AUTHENTICATION,
          eventType: AuditEventType.MFA_BACKUP_CODES_REGENERATED,
          identifier: 'account123',
          details: { userEmail: 'test@example.com' },
        });
        expect(authEmailService.sendMfaBackupCodesEmail).toHaveBeenCalledWith(
          'test@example.com',
          'Test User',
          newBackupCodes,
        );
      });
    });

    describe('getMfaStatus', () => {
      it('should return MFA status for user', async () => {
        const userWithMfa = { ...mockUser, mfaEnabled: true };
        jest.spyOn(accountUsersService, 'getAccountUserById').mockResolvedValue(userWithMfa as any);
        jest.spyOn(mfaService, 'isMfaGloballyEnabled').mockReturnValue(true);
        jest.spyOn(mfaService, 'isMfaRequired').mockResolvedValue(true);

        const result = await service.getMfaStatus('user123');

        expect(result.mfaEnabled).toBe(true);
        expect(result.mfaGloballyEnabled).toBe(true);
        expect(result.mfaRequired).toBe(true);
      });
    });
  });
});
