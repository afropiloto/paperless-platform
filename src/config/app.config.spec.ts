import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import appConfig from './app.config';

describe('AppConfig', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = appConfig();
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(configService).toBeDefined();
  });

  describe('Auth Configuration', () => {
    it('should have MFA configuration', () => {
      const config = appConfig();
      
      expect(config.auth).toBeDefined();
      expect(config.auth.mfa).toBeDefined();
      expect(config.auth.mfa.enabled).toBeDefined();
      expect(config.auth.mfa.issuer).toBeDefined();
      expect(config.auth.mfa.window).toBeDefined();
      expect(config.auth.mfa.backupCodesCount).toBeDefined();
    });

    it('should have password configuration', () => {
      const config = appConfig();
      
      expect(config.auth.password).toBeDefined();
      expect(config.auth.password.minLength).toBeDefined();
      expect(config.auth.password.requireUppercase).toBeDefined();
      expect(config.auth.password.requireLowercase).toBeDefined();
      expect(config.auth.password.requireNumbers).toBeDefined();
      expect(config.auth.password.requireSpecialChars).toBeDefined();
    });

    it('should have account lockout configuration', () => {
      const config = appConfig();
      
      expect(config.auth.accountLockout).toBeDefined();
      expect(config.auth.accountLockout.maxFailedAttempts).toBeDefined();
      expect(config.auth.accountLockout.lockoutDuration).toBeDefined();
    });

    it('should have default values', () => {
      const config = appConfig();
      
      // MFA defaults
      expect(config.auth.mfa.enabled).toBe(false); // Default when env var is not set
      expect(config.auth.mfa.issuer).toBe('Trade Documents Platform');
      expect(config.auth.mfa.window).toBe(1);
      expect(config.auth.mfa.backupCodesCount).toBe(10);
      
      // Password defaults
      expect(config.auth.password.minLength).toBe(8);
      expect(config.auth.password.requireUppercase).toBe(true);
      expect(config.auth.password.requireLowercase).toBe(true);
      expect(config.auth.password.requireNumbers).toBe(true);
      expect(config.auth.password.requireSpecialChars).toBe(true);
      
      // Lockout defaults
      expect(config.auth.accountLockout.maxFailedAttempts).toBe(5);
      expect(config.auth.accountLockout.lockoutDuration).toBe(15);
    });
  });

  describe('Environment Variable Overrides', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should respect MFA_ENABLED environment variable', () => {
      process.env.MFA_ENABLED = 'true';
      const config = appConfig();
      expect(config.auth.mfa.enabled).toBe(true);
      
      process.env.MFA_ENABLED = 'false';
      const config2 = appConfig();
      expect(config2.auth.mfa.enabled).toBe(false);
    });

    it('should respect password policy environment variables', () => {
      process.env.PASSWORD_MIN_LENGTH = '12';
      process.env.PASSWORD_REQUIRE_UPPERCASE = 'false';
      
      const config = appConfig();
      expect(config.auth.password.minLength).toBe(12);
      expect(config.auth.password.requireUppercase).toBe(false);
    });

    it('should respect lockout environment variables', () => {
      process.env.MAX_FAILED_LOGIN_ATTEMPTS = '3';
      process.env.ACCOUNT_LOCKOUT_DURATION = '30';
      
      const config = appConfig();
      expect(config.auth.accountLockout.maxFailedAttempts).toBe(3);
      expect(config.auth.accountLockout.lockoutDuration).toBe(30);
    });
  });
}); 