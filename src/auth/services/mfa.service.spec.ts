import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MfaService } from './mfa.service';

describe('MfaService', () => {
  let service: MfaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'auth.mfa.enabled': true,
                'auth.mfa.issuer': 'Test Platform',
                'auth.mfa.window': 1,
                'auth.mfa.backupCodesCount': 10,
              };
              return config[key];
            }),
          },
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
    it('should return true when MFA is enabled in config', () => {
      const isEnabled = service.isMfaGloballyEnabled();
      expect(isEnabled).toBe(true);
    });

    it('should return false when MFA is disabled in config', () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);
      const isEnabled = service.isMfaGloballyEnabled();
      expect(isEnabled).toBe(false);
    });
  });

  describe('generateSecret', () => {
    it('should generate a secret string', () => {
      const secret = service.generateSecret();
      
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should generate different secrets each time', () => {
      const secret1 = service.generateSecret();
      const secret2 = service.generateSecret();
      
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate the specified number of backup codes', () => {
      const codes = service.generateBackupCodes(5);
      
      expect(codes).toHaveLength(5);
      expect(Array.isArray(codes)).toBe(true);
    });

    it('should generate codes with default count', () => {
      const codes = service.generateBackupCodes();
      
      expect(codes).toHaveLength(10);
    });

    it('should generate different codes each time', () => {
      const codes1 = service.generateBackupCodes(3);
      const codes2 = service.generateBackupCodes(3);
      
      expect(codes1).not.toEqual(codes2);
    });

    it('should generate uppercase alphanumeric codes', () => {
      const codes = service.generateBackupCodes(1);
      const code = codes[0];
      
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });
  });

  describe('generateQrCodeUrl', () => {
    it('should generate QR code URL', async () => {
      const secret = 'TESTSECRET';
      const email = 'test@example.com';
      const issuer = 'Test Platform';
      
      const qrCodeUrl = await service.generateQrCodeUrl(secret, email, issuer);
      
      expect(qrCodeUrl).toBeDefined();
      expect(typeof qrCodeUrl).toBe('string');
      expect(qrCodeUrl).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('setupMfa', () => {
    it('should setup MFA when globally enabled', async () => {
      const email = 'test@example.com';
      
      const result = await service.setupMfa(email);
      
      expect(result.secret).toBeDefined();
      expect(result.qrCodeUrl).toBeDefined();
      expect(result.backupCodes).toBeDefined();
      expect(Array.isArray(result.backupCodes)).toBe(true);
    });

    it('should throw error when MFA is globally disabled', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);
      
      await expect(service.setupMfa('test@example.com')).rejects.toThrow(
        'MFA is not enabled in this environment'
      );
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid backup code', () => {
      const backupCodes = ['ABC123', 'DEF456', 'GHI789'];
      const code = 'ABC123';
      
      const result = service.verifyBackupCode(backupCodes, code);
      
      expect(result).toBe(true);
      expect(backupCodes).toHaveLength(2); // Code should be removed
      expect(backupCodes).not.toContain('ABC123');
    });

    it('should reject invalid backup code', () => {
      const backupCodes = ['ABC123', 'DEF456'];
      const code = 'INVALID';
      
      const result = service.verifyBackupCode(backupCodes, code);
      
      expect(result).toBe(false);
      expect(backupCodes).toHaveLength(2); // Codes should remain unchanged
    });

    it('should handle case insensitive codes', () => {
      const backupCodes = ['ABC123', 'DEF456'];
      const code = 'abc123';
      
      const result = service.verifyBackupCode(backupCodes, code);
      
      expect(result).toBe(true);
    });

    it('should handle empty backup codes array', () => {
      const backupCodes: string[] = [];
      const code = 'ABC123';
      
      const result = service.verifyBackupCode(backupCodes, code);
      
      expect(result).toBe(false);
    });
  });

  describe('verifyMfa', () => {
    it('should return valid when MFA is globally disabled', () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);
      
      const result = service.verifyMfa('secret', ['backup'], 'code');
      
      expect(result.isValid).toBe(true);
      expect(result.isBackupCode).toBe(false);
    });

    it('should verify backup codes when TOTP fails', () => {
      const backupCodes = ['ABC123'];
      const code = 'ABC123';
      
      const result = service.verifyMfa('secret', backupCodes, code);
      
      expect(result.isValid).toBe(true);
      expect(result.isBackupCode).toBe(true);
    });
  });

  describe('isMfaRequired', () => {
    it('should require MFA when globally enabled and user has MFA enabled', async () => {
      const result = await service.isMfaRequired(true);
      expect(result).toBe(true);
    });

    it('should not require MFA when globally disabled', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(false);
      
      const result = await service.isMfaRequired(true);
      expect(result).toBe(false);
    });

    it('should not require MFA when user has MFA disabled', async () => {
      const result = await service.isMfaRequired(false);
      expect(result).toBe(false);
    });
  });
}); 