import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'auth.password.minLength': 8,
                'auth.password.requireUppercase': true,
                'auth.password.requireLowercase': true,
                'auth.password.requireNumbers': true,
                'auth.password.requireSpecialChars': true,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPasswordPolicy', () => {
    it('should return password policy from config', () => {
      const policy = service.getPasswordPolicy();
      
      expect(policy.minLength).toBe(8);
      expect(policy.requireUppercase).toBe(true);
      expect(policy.requireLowercase).toBe(true);
      expect(policy.requireNumbers).toBe(true);
      expect(policy.requireSpecialChars).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      const result = service.validatePassword('StrongPass123!');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = service.validatePassword('weak');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should check minimum length', () => {
      const result = service.validatePassword('Short1!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should check for uppercase letters', () => {
      const result = service.validatePassword('lowercase123!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should check for lowercase letters', () => {
      const result = service.validatePassword('UPPERCASE123!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should check for numbers', () => {
      const result = service.validatePassword('NoNumbers!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should check for special characters', () => {
      const result = service.validatePassword('NoSpecial123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('hashPassword and comparePassword', () => {
    it('should hash and compare passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      
      const isValid = await service.comparePassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await service.comparePassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate passwords of specified length', () => {
      const password = service.generateSecurePassword(16);
      
      expect(password).toHaveLength(16);
      expect(typeof password).toBe('string');
    });

    it('should generate different passwords each time', () => {
      const password1 = service.generateSecurePassword();
      const password2 = service.generateSecurePassword();
      
      expect(password1).not.toBe(password2);
    });
  });
}); 