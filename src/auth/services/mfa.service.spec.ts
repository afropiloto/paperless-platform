import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MfaService } from './mfa.service';
import * as speakeasy from 'speakeasy';

describe('MfaService', () => {
  let service: MfaService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'auth.mfa.enabled': true,
        'auth.mfa.issuer': 'Test Platform',
        'auth.mfa.window': 1,
        'auth.mfa.backupCodesCount': 10,
        'auth.mfa.algorithm': 'sha1',
        'auth.mfa.digits': 6,
        'auth.mfa.period': 30,
        'auth.mfa.secretLength': 20,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    // Reset mock configuration to defaults
    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'auth.mfa.enabled': true,
        'auth.mfa.issuer': 'Test Platform',
        'auth.mfa.window': 1,
        'auth.mfa.backupCodesCount': 10,
        'auth.mfa.algorithm': 'sha1',
        'auth.mfa.digits': 6,
        'auth.mfa.period': 30,
        'auth.mfa.secretLength': 20,
      };
      return config[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MfaService>(MfaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isMfaGloballyEnabled', () => {
    it('should return true when MFA is enabled', () => {
      expect(service.isMfaGloballyEnabled()).toBe(true);
    });

    it('should return false when MFA is disabled', () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);
      expect(service.isMfaGloballyEnabled()).toBe(false);
    });
  });

  describe('generateSecret', () => {
    it('should generate a valid base32 secret', () => {
      const secret = service.generateSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
      // Base32 should only contain A-Z, 2-7
      expect(secret).toMatch(/^[A-Z2-7]+$/);
    });

    it('should use configured secret length', () => {
      jest.spyOn(configService, 'get').mockReturnValue(32);
      const secret = service.generateSecret();
      expect(secret).toBeDefined();
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate the specified number of backup codes', () => {
      const codes = service.generateBackupCodes(5);
      expect(codes).toHaveLength(5);
      codes.forEach(code => {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      });
    });

    it('should generate 10 codes by default', () => {
      const codes = service.generateBackupCodes();
      expect(codes).toHaveLength(10);
    });
  });

  describe('generateQrCodeUrl', () => {
    it('should generate a valid QR code URL', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const email = 'test@example.com';
      const issuer = 'Test Platform';

      const qrCodeUrl = await service.generateQrCodeUrl(secret, email, issuer);
      
      expect(qrCodeUrl).toBeDefined();
      expect(qrCodeUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should use configured algorithm and digits', async () => {
      jest.spyOn(configService, 'get')
        .mockReturnValueOnce('sha256') // algorithm
        .mockReturnValueOnce(8); // digits

      const secret = 'JBSWY3DPEHPK3PXP';
      const qrCodeUrl = await service.generateQrCodeUrl(secret, 'test@example.com');
      
      expect(qrCodeUrl).toBeDefined();
    });
  });

  describe('verifyTotp', () => {
    it('should verify valid TOTP codes', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        algorithm: 'sha1',
        digits: 6,
        step: 30,
      });

      const isValid = service.verifyTotp(secret, token);
      expect(isValid).toBe(true);
    });

    it('should reject invalid TOTP codes', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const invalidToken = '000000';

      const isValid = service.verifyTotp(secret, invalidToken);
      expect(isValid).toBe(false);
    });

    it('should handle invalid secret format', () => {
      const invalidSecret = 'invalid-secret-format';
      const token = '123456';

      const isValid = service.verifyTotp(invalidSecret, token);
      expect(isValid).toBe(false);
    });

    it('should return true when MFA is globally disabled', () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);
      
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '123456';

      const isValid = service.verifyTotp(secret, token);
      expect(isValid).toBe(true);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid backup codes', () => {
      const backupCodes = ['ABC123', 'DEF456', 'GHI789'];
      const code = 'DEF456';

      const isValid = service.verifyBackupCode(backupCodes, code);
      expect(isValid).toBe(true);
      expect(backupCodes).toHaveLength(2); // Code should be removed
      expect(backupCodes).not.toContain('DEF456');
    });

    it('should reject invalid backup codes', () => {
      const backupCodes = ['ABC123', 'DEF456'];
      const invalidCode = 'XYZ999';

      const isValid = service.verifyBackupCode(backupCodes, invalidCode);
      expect(isValid).toBe(false);
      expect(backupCodes).toHaveLength(2); // No codes should be removed
    });

    it('should handle empty backup codes array', () => {
      const backupCodes: string[] = [];
      const code = 'ABC123';

      const isValid = service.verifyBackupCode(backupCodes, code);
      expect(isValid).toBe(false);
    });
  });

  describe('verifyMfa', () => {
    it('should verify valid TOTP codes', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const backupCodes = ['ABC123', 'DEF456'];
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        algorithm: 'sha1',
        digits: 6,
        step: 30,
      });

      const result = service.verifyMfa(secret, backupCodes, token);
      expect(result.isValid).toBe(true);
      expect(result.isBackupCode).toBe(false);
    });

    it('should verify valid backup codes', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const backupCodes = ['ABC123', 'DEF456'];
      const code = 'ABC123';

      const result = service.verifyMfa(secret, [...backupCodes], code);
      expect(result.isValid).toBe(true);
      expect(result.isBackupCode).toBe(true);
    });

    it('should reject invalid codes', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const backupCodes = ['ABC123'];
      const invalidCode = '000000';

      const result = service.verifyMfa(secret, backupCodes, invalidCode);
      expect(result.isValid).toBe(false);
      expect(result.isBackupCode).toBe(false);
    });

    it('should return valid when MFA is globally disabled', () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);
      
      const secret = 'JBSWY3DPEHPK3PXP';
      const backupCodes = ['ABC123'];
      const code = '000000';

      const result = service.verifyMfa(secret, backupCodes, code);
      expect(result.isValid).toBe(true);
      expect(result.isBackupCode).toBe(false);
    });
  });

  describe('isMfaRequired', () => {
    it('should return true when MFA is globally enabled', async () => {
      const result = await service.isMfaRequired(false);
      expect(result).toBe(true);
    });

    it('should return true when user has MFA enabled', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);
      const result = await service.isMfaRequired(true);
      expect(result).toBe(true);
    });

    it('should return false when neither global nor user MFA is enabled', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);
      const result = await service.isMfaRequired(false);
      expect(result).toBe(false);
    });
  });

  describe('generateTotpToken', () => {
    it('should generate valid TOTP tokens', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = service.generateTotpToken(secret);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(6);
      expect(/^\d{6}$/.test(token)).toBe(true);
    });

    it('should throw error for invalid secret', () => {
      const invalidSecret = 'invalid-secret';
      
      expect(() => service.generateTotpToken(invalidSecret)).toThrow();
    });
  });

  describe('setupMfa', () => {
    it('should setup MFA successfully', async () => {
      const email = 'test@example.com';
      
      const result = await service.setupMfa(email);
      
      expect(result.secret).toBeDefined();
      expect(result.qrCodeUrl).toBeDefined();
      expect(result.backupCodes).toHaveLength(10);
      expect(result.secret).toMatch(/^[A-Z2-7]+$/);
      expect(result.qrCodeUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should throw error when MFA is globally disabled', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);
      
      const email = 'test@example.com';
      
      await expect(service.setupMfa(email)).rejects.toThrow('MFA is not enabled in this environment');
    });
  });
}); 