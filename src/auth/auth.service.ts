import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto, TokenRefreshResponseDto } from './dtos';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './dtos';
import { SiweService } from '../siwe/siwe.service';
import { ConfigService } from '@nestjs/config';
import { AccountUsersService } from '../account-users/account-users.service';
import { AccountsService } from '../accounts/accounts.service';
import { JwtPayload } from './types';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';

import { EmailPasswordLoginDto } from './dtos';
import { PasswordService } from './services/password.service';
import { MfaService } from './services/mfa.service';
import { AuthEmailService } from './services/auth-email.service';
import { ChangePasswordDto } from './dtos';
import { ForgotPasswordDto } from './dtos';
import { ResetPasswordDto } from './dtos';
import { PasswordResetTokenRepository } from './repositories/password-reset-token.repository';
import { CreatePasswordResetTokenDto } from './dtos';
import * as crypto from 'crypto';
import { GeneralResponseDto } from '../common/common-dto';
import { MfaStatusDto, MfaVerificationResponseDto } from './dtos/mfa-verification.dto';
import { MfaDisableResponseDto, RegenerateBackupCodesResponseDto } from './dtos/mfa-management.dto';
import { MfaVerifySetupResponseDto } from './dtos/mfa-setup.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);


  constructor(
    private readonly auditService: AuditService,
    private readonly jwtService: JwtService,
    private readonly siweService: SiweService,
    private readonly accountUsersService: AccountUsersService,
    private readonly accountsService: AccountsService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly mfaService: MfaService,
    private readonly authEmailService: AuthEmailService,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      if (!loginDto?.message || !loginDto?.signature) {
        throw new UnauthorizedException('Missing login credentials');
      }

      // Verify the SIWE message and get wallet address
      const walletAddress = await this.siweService.verifyMessage(
        loginDto.message,
        loginDto.signature,
      );

      // Find the account user by wallet address
      const accountUser =
        await this.accountUsersService.findAccountUserByWalletAddress(
          walletAddress,
        );

      if (!accountUser) {
        this.logger.warn('Login attempt for unauthorized wallet address', {
          walletAddress,
        });
        throw new UnauthorizedException('Account user not authorized');
      }

      // Get account details for additional information
      const accountDetails =
        await this.accountsService.findByWalletAddress(walletAddress);
      if (!accountDetails) {
        this.logger.warn('Account not found for  user', {
          walletAddress,
          userId: accountUser.id,
        });
        throw new UnauthorizedException('Account not found');
      }

      // Generate JWT payload with user permissions
      const jwtPayload: JwtPayload = {
        accountId: accountUser.accountId,
        userId: accountUser.id,
        walletAddress: accountUser.walletAddress,
        permissions: accountUser.permissions,
      };
      // Generate JWT tokens
      const accessToken = this.jwtService.sign(jwtPayload, {
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      });
      const refreshToken = this.jwtService.sign(jwtPayload, {
        expiresIn: this.configService.get<string>('refreshToken.expiresIn'),
      });

      this.logger.debug(accountUser)
      await this.auditService.log({ subject: AuditSubject.AUTHENTICATION, eventType: AuditEventType.LOGIN_SUCCESSFUL, identifier: accountUser.accountId, details:{accountName:accountDetails.accountName} });
      return plainToInstance(
        AuthResponseDto,
        {
          success: true,
          accessToken,
          refreshToken,
          accountId: accountUser.accountId,
          accountName: accountDetails.accountName,
          accountEmail: accountDetails.contact.emailAddress,
          userId: accountUser.id,
          userName: accountUser.name,
          userEmail: accountUser.emailAddress,
          walletAddress: accountUser.walletAddress,
          permissions: accountUser.permissions,
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error('Login failed', {
        error: error.message,
        stack: error.stack,
        loginDto,
      });
      throw error; // Re-throw to maintain the original error type
    }
  }

  async loginWithEmailPassword(loginDto: EmailPasswordLoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email (including sensitive fields for auth)
    const user = await this.accountUsersService.findAccountUserByEmailForAuth(email);
    if (!user) {
      this.logger.warn('User not found for email', { email });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      this.logger.warn('Account locked for email', { email, lockedUntil: user.accountLockedUntil });
      throw new UnauthorizedException('Account is locked. Please try again later.');
    }

    // Validate password
    const passwordHash = user.passwordHash;
    if (!passwordHash || !(await this.passwordService.comparePassword(password, passwordHash))) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const maxAttempts = this.configService.get<number>('auth.accountLockout.maxFailedAttempts');
      const lockoutDuration = this.configService.get<number>('auth.accountLockout.lockoutDuration');
      const isLockout = failedAttempts >= maxAttempts;
      await this.accountUsersService.updateAccountUserSecurity(user.id, {
        failedLoginAttempts: failedAttempts,
        accountLockedUntil: isLockout ? new Date(Date.now() + (lockoutDuration * 60 * 1000)) : undefined,
      });
      if (isLockout) {
        await this.auditService.log({
          subject: AuditSubject.AUTHENTICATION,
          eventType: AuditEventType.LOGIN_FAILED,
          identifier: user.accountId,
          details: { reason: 'Account locked after failed attempts', userEmail: user.emailAddress },
        });
      }
      this.logger.warn('Invalid password for email', { email });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failed login attempts on success
    if (user.failedLoginAttempts > 0) {
      await this.accountUsersService.updateAccountUserSecurity(user.id, {
        failedLoginAttempts: 0,
        accountLockedUntil: undefined,
      });
    }

    // Check if this is the user's first login
    if (!user.firstLoginAt) {
      await this.accountUsersService.updateAccountUser(user.id, {
        firstLoginAt: new Date(),
      });
    }

    // Get account details
    const accountDetails = await this.accountsService.findByAccountId(user.accountId);
    if (!accountDetails) {
      throw new UnauthorizedException('Account not found');
    }

    // Prepare JWT payload
    const jwtPayload: JwtPayload = {
      accountId: user.accountId,
      userId: user.id,
      walletAddress: user.walletAddress,
      permissions: user.permissions,
    };

    // Generate tokens
    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });
    const refreshToken = this.jwtService.sign(jwtPayload, {
      expiresIn: this.configService.get<string>('refreshToken.expiresIn'),
    });

    // Check if MFA setup is required
    if (user.mfaSetupRequired && !user.mfaEnabled) {
      return plainToInstance(
        AuthResponseDto,
        {
          success: false,
          mfaRequired: true,
          mfaSetupRequired: true,
          message: 'MFA setup required before login',
          userId: user.id,
          userEmail: user.emailAddress,
          accountId: user.accountId,
          accountName: accountDetails.accountName,
          accountEmail: accountDetails.contact.emailAddress,
          userName: user.name,
          walletAddress: user.walletAddress,
          permissions: user.permissions,
        },
        { excludeExtraneousValues: true },
      );
    }

    // Check if MFA is required for login
    const mfaRequired = await this.mfaService.isMfaRequired(user.mfaEnabled);
    
    if (mfaRequired) {
      // Return response indicating MFA is required
      await this.auditService.log({
        subject: AuditSubject.AUTHENTICATION,
        eventType: AuditEventType.LOGIN_SUCCESSFUL,
        identifier: user.accountId,
        details: { accountName: accountDetails.accountName, userEmail: user.emailAddress, mfaRequired: true },
      });

      return plainToInstance(
        AuthResponseDto,
        {
          success: true,
          mfaRequired: true,
          userId: user.id,
          userEmail: user.emailAddress,
          accountId: user.accountId,
          accountName: accountDetails.accountName,
          accountEmail: accountDetails.contact.emailAddress,
          userName: user.name,
          walletAddress: user.walletAddress,
          permissions: user.permissions,
        },
        { excludeExtraneousValues: true },
      );
    }

    // MFA not required, proceed with normal login
    await this.auditService.log({
      subject: AuditSubject.AUTHENTICATION,
      eventType: AuditEventType.LOGIN_SUCCESSFUL,
      identifier: user.accountId,
      details: { accountName: accountDetails.accountName, userEmail: user.emailAddress },
    });

    return plainToInstance(
      AuthResponseDto,
      {
        success: true,
        accessToken,
        refreshToken,
        accountId: user.accountId,
        accountName: accountDetails.accountName,
        accountEmail: accountDetails.contact.emailAddress,
        userId: user.id,
        userName: user.name,
        userEmail: user.emailAddress,
        walletAddress: user.walletAddress,
        permissions: user.permissions,
      },
      { excludeExtraneousValues: true },
    );
  }

  async refreshToken(token: string): Promise<TokenRefreshResponseDto> {
    try {
      const decoded = this.jwtService.verify(token) as JwtPayload;

      // Validate that the user still exists and is active
      const accountUser = await this.accountUsersService.getAccountUserById(
        decoded.userId,
      );

      // Update the payload with current permissions (in case they changed)
      const updatedPayload: JwtPayload = {
        accountId: decoded.accountId,
        userId: decoded.userId,
        walletAddress: decoded.walletAddress,
        permissions: accountUser.permissions,
      };

      const newAccessToken = this.jwtService.sign(updatedPayload, {
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      });

      const responsePayload: TokenRefreshResponseDto = { success: true, accessToken: newAccessToken };
      this.logger.debug(responsePayload);
      return  plainToInstance(TokenRefreshResponseDto, responsePayload);
    } catch (error) {
      this.logger.error({ message: 'Error verifying refresh token', error });
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<GeneralResponseDto> {
    const user = await this.accountUsersService.getAccountUserSecurityDetailsById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const passwordHash = user.passwordHash;
    this.logger.debug({passwordHash, dto})
    if (!passwordHash || !(await this.passwordService.comparePassword(dto.currentPassword, passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    // Enforce password policy
    const validation = this.passwordService.validatePassword(dto.newPassword);
    if (!validation.isValid) {
      throw new UnauthorizedException('New password does not meet policy: ' + validation.errors.join(', '));
    }
    // Hash and update password
    const newHash = await this.passwordService.hashPassword(dto.newPassword);
    await this.accountUsersService.updateAccountUserSecurity(userId, {
      passwordHash: newHash,
      passwordChanged: true,
    });
    await this.auditService.log({
      subject: AuditSubject.AUTHENTICATION,
      eventType: AuditEventType.PASSWORD_CHANGED,
      identifier: user.accountId,
      details: { userEmail: user.emailAddress },
    });

    // Send security alert email
    try {
      await this.authEmailService.sendSecurityAlertEmail(
        user.emailAddress,
        user.name,
        'password_change',
        { timestamp: new Date().toLocaleString() },
      );
    } catch (error) {
      this.logger.error(`Failed to send security alert email to ${user.emailAddress}:`, error);
      // Continue even if email fails
    }

    return plainToInstance(GeneralResponseDto, { success: true, message: 'Password changed successfully' });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<GeneralResponseDto> {
    const user = await this.accountUsersService.findAccountUserByEmail(dto.email);
    if (!user) {
      // Do not reveal if user exists
      return plainToInstance(GeneralResponseDto, { success: true, message: 'If the email exists, a reset link will be sent.' });
    }
    
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min expiry
    
    // Store token in database
    const createTokenDto: CreatePasswordResetTokenDto = {
      token,
      userId: user.id,
      expiresAt,
    };
    
    try {
      await this.passwordResetTokenRepository.create(createTokenDto);
      
      // Send password reset email
      await this.authEmailService.sendPasswordResetEmail(
        user.emailAddress,
        user.name,
        token,
      );
      
      this.logger.log(`Password reset email sent to ${dto.email}`);

    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${dto.email}:`, error);
      // Don't expose email sending errors to user for security
    }
    
    return plainToInstance(GeneralResponseDto, { success: true, message: 'If the email exists, a reset link will be sent.' });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<GeneralResponseDto> {
    const tokenEntry = await this.passwordResetTokenRepository.findByToken(dto.token);
    if (!tokenEntry) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    
    // Enforce password policy
    const validation = this.passwordService.validatePassword(dto.newPassword);
    if (!validation.isValid) {
      throw new UnauthorizedException('New password does not meet policy: ' + validation.errors.join(', '));
    }
    
    // Hash and update password
    const newHash = await this.passwordService.hashPassword(dto.newPassword);
    await this.accountUsersService.updateAccountUserSecurity(tokenEntry.userId, {
      passwordHash: newHash,
      passwordChanged: true,
      failedLoginAttempts: 0,
      accountLockedUntil: undefined,
    });
    
    // Mark token as used
    this.logger.debug("Setting token as used")
    await this.passwordResetTokenRepository.markAsUsed(dto.token);
    
    // Audit log
    this.logger.debug("Writting audit log")
    const user = await this.accountUsersService.getAccountUserById(tokenEntry.userId);
    await this.auditService.log({
      subject: AuditSubject.AUTHENTICATION,
      eventType: AuditEventType.PASSWORD_RESET,
      identifier: user.accountId,
      details: { userEmail: user.emailAddress },
    });
    this.logger.debug("returning response")
    return plainToInstance(GeneralResponseDto, {success: true, message: 'Password has been reset successfully' })
  }

  // MFA Setup and Management Methods
  async setupMfa(userId: string): Promise<{
    success: boolean;
    message: string;
    qrCodeUrl: string;
    secret: string;
    backupCodes: string[];
    requiresVerification: boolean;
  }> {
    const user = await this.accountUsersService.getAccountUserSecurityDetailsById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.mfaEnabled) {
      throw new UnauthorizedException('MFA is already enabled for this user');
    }

    const mfaSetup = await this.mfaService.setupMfa(user.emailAddress);
    
    // Store the temporary MFA secret (will be confirmed after verification)
    await this.accountUsersService.updateAccountUserSecurity(userId, {
      mfaSecret: mfaSetup.secret,
      mfaBackupCodes: mfaSetup.backupCodes,
      mfaEnabled: false, // Will be set to true after verification
    });

    await this.auditService.log({
      subject: AuditSubject.AUTHENTICATION,
      eventType: AuditEventType.MFA_SETUP_INITIATED,
      identifier: user.accountId,
      details: { userEmail: user.emailAddress },
    });

    // Send backup codes via email
    try {
      await this.authEmailService.sendMfaSetupEmail(
        user.emailAddress,
        user.name,
        mfaSetup.backupCodes,
        mfaSetup.qrCodeUrl, // Pass the QR code URL
      );
    } catch (error) {
      this.logger.error(`Failed to send MFA setup email to ${user.emailAddress}:`, error);
      // Continue with setup even if email fails
    }

    return {
      success: true,
      message: 'MFA setup initiated successfully. Please scan the QR code with your authenticator app.',
      qrCodeUrl: mfaSetup.qrCodeUrl,
      secret: mfaSetup.secret,
      backupCodes: mfaSetup.backupCodes,
      requiresVerification: true,
    };
  }

  async verifyMfaSetup(userId: string, totpCode: string): Promise<MfaVerifySetupResponseDto> {
    const user = await this.accountUsersService.getAccountUserSecurityDetailsById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const mfaSecret = user.mfaSecret;
    if (!mfaSecret) {
      throw new UnauthorizedException('MFA setup not initiated');
    }

    const verificationResult = this.mfaService.verifyMfa(mfaSecret, user.mfaBackupCodes, totpCode);
    if (!verificationResult.isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    // Enable MFA for the user
    await this.accountUsersService.updateAccountUserSecurity(userId, {
      mfaEnabled: true,
      mfaSetupCompleted: new Date(),
    });

    await this.auditService.log({
      subject: AuditSubject.AUTHENTICATION,
      eventType: AuditEventType.MFA_SETUP_COMPLETED,
      identifier: user.accountId,
      details: { userEmail: user.emailAddress },
    });

    return plainToInstance(MfaVerifySetupResponseDto, {
      success: true,
      message: 'MFA setup completed successfully',
    });
  }

  async verifyMfa(userId: string, code: string, isBackupCode: boolean = false): Promise<MfaVerificationResponseDto> {
    const user = await this.accountUsersService.getAccountUserSecurityDetailsById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new UnauthorizedException('MFA is not enabled for this user');
    }

    const mfaSecret = user.mfaSecret;
    const backupCodes = user.mfaBackupCodes;
    
    if (!mfaSecret) {
      throw new UnauthorizedException('MFA not properly configured');
    }

    const verificationResult = this.mfaService.verifyMfa(mfaSecret, backupCodes, code);
    const isValid = verificationResult.isValid;
    if (!isValid) {
      await this.auditService.log({
        subject: AuditSubject.AUTHENTICATION,
        eventType: AuditEventType.MFA_VERIFICATION_FAILED,
        identifier: user.accountId,
        details: { userEmail: user.emailAddress, reason: 'Invalid MFA code' },
      });
      throw new UnauthorizedException('Invalid MFA code');
    }

    // Generate JWT tokens for successful MFA verification
    const jwtPayload: JwtPayload = {
      accountId: user.accountId,
      userId: user.id,
      walletAddress: user.walletAddress,
      permissions: user.permissions,
    };

    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });
    const refreshToken = this.jwtService.sign(jwtPayload, {
      expiresIn: this.configService.get<string>('refreshToken.expiresIn'),
    });

    await this.auditService.log({
      subject: AuditSubject.AUTHENTICATION,
      eventType: AuditEventType.MFA_VERIFICATION_SUCCESSFUL,
      identifier: user.accountId,
      details: { userEmail: user.emailAddress },
    });

    return plainToInstance(MfaVerificationResponseDto, {
      success: true,
      message: 'MFA verification successful',
      accessToken,
      refreshToken,
    });
  }

  async disableMfa(userId: string, currentPassword: string, verificationCode: string): Promise<MfaDisableResponseDto> {
    const user = await this.accountUsersService.getAccountUserSecurityDetailsById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const passwordHash = user.passwordHash;
    if (!passwordHash || !(await this.passwordService.comparePassword(currentPassword, passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Verify MFA code
    const mfaSecret = user.mfaSecret;
    const backupCodes = user.mfaBackupCodes;
    
    if (!mfaSecret) {
      throw new UnauthorizedException('MFA is not enabled for this user');
    }

    const verificationResult = this.mfaService.verifyMfa(mfaSecret, backupCodes, verificationCode);
    const isValid = verificationResult.isValid;
    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Disable MFA
    await this.accountUsersService.updateAccountUserSecurity(userId, {
      mfaEnabled: false,
      mfaSecret: undefined,
      mfaBackupCodes: undefined,
      mfaSetupCompleted: undefined,
    });

    await this.auditService.log({
      subject: AuditSubject.AUTHENTICATION,
      eventType: AuditEventType.MFA_DISABLED,
      identifier: user.accountId,
      details: { userEmail: user.emailAddress },
    });

    // Send security alert email
    try {
      await this.authEmailService.sendSecurityAlertEmail(
        user.emailAddress,
        user.name,
        'mfa_disable',
        { timestamp: new Date().toLocaleString() },
      );
    } catch (error) {
      this.logger.error(`Failed to send security alert email to ${user.emailAddress}:`, error);
      // Continue even if email fails
    }

    return plainToInstance(MfaDisableResponseDto, {
      success: true,
      message: 'MFA has been disabled successfully',
    });
  }

  async regenerateBackupCodes(userId: string, currentPassword: string, totpCode: string): Promise<RegenerateBackupCodesResponseDto> {
    const user = await this.accountUsersService.getAccountUserSecurityDetailsById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const passwordHash = user.passwordHash;
    if (!passwordHash || !(await this.passwordService.comparePassword(currentPassword, passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Verify TOTP code
    const mfaSecret = user.mfaSecret;
    if (!mfaSecret) {
      throw new UnauthorizedException('MFA is not enabled for this user');
    }

    const verificationResult = this.mfaService.verifyMfa(mfaSecret, user.mfaBackupCodes, totpCode);
    const isValid = verificationResult.isValid;
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    // Generate new backup codes
    const newBackupCodes = this.mfaService.generateBackupCodes();

    // Update user with new backup codes
    await this.accountUsersService.updateAccountUserSecurity(userId, {
      mfaBackupCodes: newBackupCodes,
    });

    await this.auditService.log({
      subject: AuditSubject.AUTHENTICATION,
      eventType: AuditEventType.MFA_BACKUP_CODES_REGENERATED,
      identifier: user.accountId,
      details: { userEmail: user.emailAddress },
    });

    // Send new backup codes via email
    try {
      await this.authEmailService.sendMfaBackupCodesEmail(
        user.emailAddress,
        user.name,
        newBackupCodes,
      );
    } catch (error) {
      this.logger.error(`Failed to send MFA backup codes email to ${user.emailAddress}:`, error);
      // Continue even if email fails
    }

    return plainToInstance(RegenerateBackupCodesResponseDto, {
      success: true,
      message: 'Backup codes regenerated successfully',
      backupCodes: newBackupCodes,
      warning: 'Previous backup codes are no longer valid',
    });
  }

  async getMfaStatus(userId: string): Promise<MfaStatusDto> {
    const user = await this.accountUsersService.getAccountUserSecurityDetailsById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const mfaGloballyEnabled = this.mfaService.isMfaGloballyEnabled();
    const mfaEnabled = user.mfaEnabled || false;
    const mfaRequired = await this.mfaService.isMfaRequired(mfaEnabled);

    return plainToInstance(MfaStatusDto, {
      mfaEnabled,
      mfaGloballyEnabled,
      mfaRequired,
    });
  }
}
