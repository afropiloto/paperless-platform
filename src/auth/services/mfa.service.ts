import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
//import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as otplib from 'otplib';

const authenticator = (otplib as any).authenticator;

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
  
  constructor(private readonly configService: ConfigService) {
    const window = this.configService.get<number>('auth.mfa.window');
    const algorithm = this.configService.get<string>('auth.mfa.algorithm');
    const digits = this.configService.get<number>('auth.mfa.digits');
    const period = this.configService.get<number>('auth.mfa.period');

    authenticator.options = {
      digits,
      step: period,
      algorithm: algorithm.toLowerCase() as never,
      window
    }


  }

  /**
   * Check if MFA is globally enabled
   */
  isMfaGloballyEnabled(): boolean {
    return this.configService.get<boolean>('auth.mfa.enabled') === true;
  }

  /**
   * Generate a new TOTP secret using speakeasy
   */
  generateSecret(): string {
    const secretLength = this.configService.get<number>('auth.mfa.secretLength') || 20;
    return authenticator.generateSecret(secretLength);
    // const secret = speakeasy.generateSecret({
    //   name: this.configService.get<string>('auth.mfa.issuer') || 'Trade Documents Platform',
    //   length: secretLength,
    // });
    //
    // if (!secret.base32) {
    //   throw new Error('Failed to generate TOTP secret');
    // }
    //return secret.base32;
  }

  /**
   * Generate backup codes with improved entropy
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 10-character alphanumeric codes with better entropy
      const code = authenticator.generateSecret(5)
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate QR code URL for authenticator apps using speakeasy format
   */
  async generateQrCodeUrl(
    secret: string,
    email: string,
    issuer: string = 'Trade Documents Platform'
  ): Promise<string> {
    

    
    const uri = authenticator.keyuri(email, issuer, secret )
    //const otpauthUrl = speakeasy.otpauthURL(otpAuthUrlOptions);
    
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

      return authenticator.verify({token, secret});

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

      return authenticator.generate(secret);

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