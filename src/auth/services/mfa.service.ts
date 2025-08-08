import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MfaVerificationResult {
  isValid: boolean;
  isBackupCode: boolean;
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Check if MFA is globally enabled
   */
  isMfaGloballyEnabled(): boolean {
    return this.configService.get<boolean>('auth.mfa.enabled') === true;
  }

  /**
   * Generate a new TOTP secret
   */
  generateSecret(): string {
    // Generate 20 random bytes and convert to base32-like string
    const bytes = crypto.randomBytes(20);
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      result += base32Chars[byte & 31];
      if (i % 5 === 4) result += base32Chars[(byte >> 5) & 7];
    }
    
    return result;
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate QR code URL for authenticator apps
   */
  async generateQrCodeUrl(
    secret: string,
    email: string,
    issuer: string = 'Trade Documents Platform'
  ): Promise<string> {
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      this.logger.error('Failed to generate QR code', error);
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  /**
   * Setup MFA for a user
   */
  async setupMfa(email: string): Promise<MfaSetupResponse> {
    // Check if MFA is globally enabled
    if (!this.isMfaGloballyEnabled()) {
      throw new BadRequestException('MFA is not enabled in this environment');
    }

    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes(
      this.configService.get<number>('auth.mfa.backupCodesCount') || 10
    );
    
    const qrCodeUrl = await this.generateQrCodeUrl(
      secret,
      email,
      this.configService.get<string>('auth.mfa.issuer') || 'Trade Documents Platform'
    );

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code
   */
  verifyTotp(secret: string, token: string): boolean {
    // If MFA is globally disabled, always return true
    if (!this.isMfaGloballyEnabled()) {
      return true;
    }

    // Simple TOTP verification (in production, use a proper TOTP library like speakeasy)
    // This is a basic implementation - you should replace this with a proper TOTP library
    const window = this.configService.get<number>('auth.mfa.window') || 1;
    
    // For now, we'll use a simple time-based validation
    // In the next phase, we'll add the speakeasy library for proper TOTP validation
    return this.simpleTotpValidation(secret, token, window);
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(backupCodes: string[], code: string): boolean {
    if (!backupCodes || backupCodes.length === 0) {
      return false;
    }

    const index = backupCodes.indexOf(code.toUpperCase());
    if (index === -1) {
      return false;
    }

    // Remove the used backup code
    backupCodes.splice(index, 1);
    return true;
  }

  /**
   * Verify MFA (TOTP or backup code)
   */
  verifyMfa(
    secret: string,
    backupCodes: string[],
    code: string
  ): MfaVerificationResult {
    // If MFA is globally disabled, always return valid
    if (!this.isMfaGloballyEnabled()) {
      return { isValid: true, isBackupCode: false };
    }

    // First try TOTP verification
    if (this.verifyTotp(secret, code)) {
      return { isValid: true, isBackupCode: false };
    }

    // Then try backup code verification
    if (this.verifyBackupCode(backupCodes, code)) {
      return { isValid: true, isBackupCode: true };
    }

    return { isValid: false, isBackupCode: false };
  }

  /**
   * Check if MFA is required for a user
   */
  async isMfaRequired(userMfaEnabled: boolean): Promise<boolean> {
    // MFA is required if:
    // 1. MFA is globally enabled AND
    // 2. User has MFA enabled
    return this.isMfaGloballyEnabled() && userMfaEnabled;
  }

  /**
   * Simple TOTP validation (temporary implementation)
   * This will be replaced with proper TOTP library in the next phase
   */
  private simpleTotpValidation(secret: string, token: string, window: number): boolean {
    // This is a placeholder implementation
    // In the next phase, we'll add the speakeasy library for proper TOTP validation
    this.logger.warn('Using simple TOTP validation - should be replaced with proper library');
    
    // For now, return false to require proper implementation
    return false;
  }
} 