import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailTemplatesService } from './email-templates.service';

describe('EmailTemplatesService', () => {
  let service: EmailTemplatesService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplatesService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'app.name': 'Test App',
                'app.url': 'https://test.example.com',
                'app.supportEmail': 'test@example.com',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailTemplatesService>(EmailTemplatesService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePasswordResetEmail', () => {
    it('should generate password reset email with correct data', () => {
      const emailData = {
        userName: 'John Doe',
        resetUrl: 'https://test.example.com/reset?token=abc123',
        expiryMinutes: 30,
      };

      const result = service.generatePasswordResetEmail(emailData);

      expect(result.subject).toBe('Reset Your Test App Password');
      expect(result.htmlContent).toContain('John Doe');
      expect(result.htmlContent).toContain('https://test.example.com/reset?token=abc123');
      expect(result.htmlContent).toContain('30 minutes');
      expect(result.textContent).toContain('John Doe');
      expect(result.textContent).toContain('https://test.example.com/reset?token=abc123');
      expect(result.textContent).toContain('30 minutes');
    });

    it('should include custom support email when provided', () => {
      const emailData = {
        userName: 'John Doe',
        resetUrl: 'https://test.example.com/reset?token=abc123',
        expiryMinutes: 30,
        supportEmail: 'custom@example.com',
      };

      const result = service.generatePasswordResetEmail(emailData);

      expect(result.htmlContent).toContain('custom@example.com');
      expect(result.textContent).toContain('custom@example.com');
    });
  });

  describe('generateMfaSetupEmail', () => {
    it('should generate MFA setup email with backup codes', () => {
      const emailData = {
        userName: 'John Doe',
        backupCodes: ['ABC123', 'DEF456', 'GHI789'],
      };

      const result = service.generateMfaSetupEmail(emailData);

      expect(result.subject).toBe('Your Test App Backup Codes');
      expect(result.htmlContent).toContain('John Doe');
      expect(result.htmlContent).toContain('ABC123');
      expect(result.htmlContent).toContain('DEF456');
      expect(result.htmlContent).toContain('GHI789');
      expect(result.textContent).toContain('John Doe');
      expect(result.textContent).toContain('ABC123');
      expect(result.textContent).toContain('DEF456');
      expect(result.textContent).toContain('GHI789');
    });

    it('should generate MFA setup email with QR code when provided', () => {
      const emailData = {
        userName: 'John Doe',
        backupCodes: ['ABC123', 'DEF456', 'GHI789'],
        qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
      };

      const result = service.generateMfaSetupEmail(emailData);

      expect(result.subject).toBe('Your Test App Two-Factor Authentication Setup');
      expect(result.htmlContent).toContain('John Doe');
      expect(result.htmlContent).toContain('ABC123');
      expect(result.htmlContent).toContain('DEF456');
      expect(result.htmlContent).toContain('GHI789');
      expect(result.htmlContent).toContain('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...');
      expect(result.htmlContent).toContain('To complete the setup, please scan the QR code below');
      expect(result.textContent).toContain('John Doe');
      expect(result.textContent).toContain('ABC123');
      expect(result.textContent).toContain('DEF456');
      expect(result.textContent).toContain('GHI789');
      expect(result.textContent).toContain('To complete the setup, please scan the QR code in the HTML version');
    });

    it('should include custom support email when provided', () => {
      const emailData = {
        userName: 'John Doe',
        backupCodes: ['ABC123'],
        supportEmail: 'custom@example.com',
      };

      const result = service.generateMfaSetupEmail(emailData);

      expect(result.htmlContent).toContain('custom@example.com');
      expect(result.textContent).toContain('custom@example.com');
    });
  });

  describe('generateMfaBackupCodesEmail', () => {
    it('should generate MFA backup codes regeneration email', () => {
      const emailData = {
        userName: 'John Doe',
        backupCodes: ['XYZ789', 'DEF456', 'GHI123'],
      };

      const result = service.generateMfaBackupCodesEmail(emailData);

      expect(result.subject).toBe('Your Test App Backup Codes Have Been Regenerated');
      expect(result.htmlContent).toContain('John Doe');
      expect(result.htmlContent).toContain('XYZ789');
      expect(result.htmlContent).toContain('DEF456');
      expect(result.htmlContent).toContain('GHI123');
      expect(result.htmlContent).toContain('Your previous backup codes are no longer valid');
      expect(result.textContent).toContain('John Doe');
      expect(result.textContent).toContain('XYZ789');
      expect(result.textContent).toContain('DEF456');
      expect(result.textContent).toContain('GHI123');
      expect(result.textContent).toContain('Your previous backup codes are no longer valid');
    });
  });

  describe('default configuration', () => {
    it('should use default values when config is not provided', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailTemplatesService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(undefined),
            },
          },
        ],
      }).compile();

      const serviceWithDefaults = module.get<EmailTemplatesService>(EmailTemplatesService);
      const emailData = {
        userName: 'John Doe',
        resetUrl: 'https://test.example.com/reset?token=abc123',
        expiryMinutes: 30,
      };

      const result = serviceWithDefaults.generatePasswordResetEmail(emailData);

      expect(result.subject).toBe('Reset Your Trade Documents Platform Password');
      expect(result.htmlContent).toContain('support@tradedocs.com');
      expect(result.textContent).toContain('support@tradedocs.com');
    });
  });
}); 