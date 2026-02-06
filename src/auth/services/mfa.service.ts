import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import {
  generateSecret,
  generateURI,
  generateSync,
  verifySync,
} from 'otplib';

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

  private get totpOptions() {
    const algorithm = (this.configService.get<string>('auth.mfa.algorithm') ?? 'sha1').toLowerCase() as 'sha1' | 'sha256' | 'sha512';
    const digits = this.configService.get<number>('auth.mfa.digits') ?? 6;
    const period = this.configService.get<number>('auth.mfa.period') ?? 30;
    const window = this.configService.get<number>('auth.mfa.window') ?? 0;
    return { algorithm, digits, period, epochTolerance: window };
  }

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
    const secretLength = this.configService.get<number>('auth.mfa.secretLength') || 20;
    return generateSecret({ length: secretLength });
  }

  /**
   * Generate backup codes with improved entropy
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(generateSecret({ length: 5 }));
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
    const opts = this.totpOptions;
    const uri = generateURI({
      issuer,
      label: email,
      secret,
      algorithm: opts.algorithm,
      digits: opts.digits,
      period: opts.period,
    });
    try {
      return QRCode.toDataURL(uri);
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
   * Verify TOTP code using speakeasy
   */
  verifyTotp(secret: string, token: string): boolean {
    // // If MFA is globally disabled, always return true
    // if (!this.isMfaGloballyEnabled()) {
    //   return true;
    // }

    try {
      // Validate secret format
      if (!this.isValidSecret(secret)) {
        this.logger.warn('Invalid TOTP secret format');
        return false;
      }

      const opts = this.totpOptions;
      const result = verifySync({
        secret,
        token,
        algorithm: opts.algorithm,
        digits: opts.digits,
        period: opts.period,
        epochTolerance: opts.epochTolerance,
      });
      return result.valid;

      // const totpVerificationDetails: TotpVerifyOptions = {
      //   secret: secret,
      //   encoding: 'base32',
      //   token: token,
      //   window: window,
      //   algorithm: algorithm,
      //   digits: digits,
      //   step: period,
      // }
      // this.logger.debug({totpVerificationDetails})
      // // Use speakeasy for proper TOTP validation
      // const delta = speakeasy.totp.verifyDelta(totpVerificationDetails);
      // this.logger.debug({delta})
      // const isValid = speakeasy.totp.verify(totpVerificationDetails);
      // this.logger.debug({isValid})

    } catch (error) {
      this.logger.error('TOTP verification error:', error);
      return false;
    }
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
      const response ={ isValid: true, isBackupCode: false };

      return response
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
    // 1. MFA is globally enabled OR
    // 2. User has MFA enabled

    const globalEnabled = this.isMfaGloballyEnabled();

    return globalEnabled || userMfaEnabled;
  }

  /**
   * Validate TOTP secret format
   */
  private isValidSecret(secret: string): boolean {
    if (!secret || typeof secret !== 'string') {
      return false;
    }
    
    // Check if secret is valid base32 format (only contains A-Z, 2-7)
    const base32Regex = /^[A-Z2-7]+$/;
    if (!base32Regex.test(secret)) {
      return false;
    }
    
    // Check if secret has valid length (should be multiple of 8)
    if (secret.length % 8 !== 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Generate a TOTP token for testing purposes
   */
  generateTotpToken(secret: string): string {
    try {
      if (!this.isValidSecret(secret)) {
        throw new Error('Invalid secret format');
      }

      const opts = this.totpOptions;
      return generateSync({
        secret,
        algorithm: opts.algorithm,
        digits: opts.digits,
        period: opts.period,
      });

      // return speakeasy.totp({
      //   secret: secret,
      //   encoding: 'base32',
      //   algorithm: (this.configService.get<string>('auth.mfa.algorithm') || 'sha1') as 'sha1' | 'sha256' | 'sha512',
      //   digits: this.configService.get<number>('auth.mfa.digits') || 6,
      //   step: this.configService.get<number>('auth.mfa.period') || 30,
      // });
    } catch (error) {
      this.logger.error('Failed to generate TOTP token:', error);
      throw new BadRequestException('Failed to generate TOTP token');
    }
  }
} 