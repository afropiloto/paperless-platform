import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountUser } from '../src/account-users/schemas/account-user.schema';
import { Account } from '../src/accounts/schemas/account.schema';
import { PasswordService } from '../src/auth/services/password.service';

describe('Auth Integration (e2e)', () => {
  let app: INestApplication;
  let accountUserModel: Model<AccountUser>;
  let accountModel: Model<Account>;
  let passwordService: PasswordService;

  const testUser = {
    name: 'Test User',
    emailAddress: 'test@example.com',
    walletAddress: '0x1234567890abcdef',
    status: 'Active',
    permissions: [{ module: 'DealDesk', role: 'Agent' }],
    authMethod: 'email-password',
    mfaEnabled: false,
  };

  const testAccount = {
    accountName: 'Test Account',
    contact: { emailAddress: 'account@example.com' },
    status: 'Active',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    accountUserModel = moduleFixture.get<Model<AccountUser>>(getModelToken(AccountUser.name));
    accountModel = moduleFixture.get<Model<Account>>(getModelToken(Account.name));
    passwordService = moduleFixture.get<PasswordService>(PasswordService);

    await app.init();
  });

  beforeEach(async () => {
    // Clean up test data
    await accountUserModel.deleteMany({ emailAddress: testUser.emailAddress });
    await accountModel.deleteMany({ accountName: testAccount.accountName });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Email/Password Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // 1. Create test account
      const account = await accountModel.create(testAccount);

      // 2. Create test user with hashed password
      const hashedPassword = await passwordService.hashPassword('ValidPassword123!');
      const user = await accountUserModel.create({
        ...testUser,
        accountId: account.id,
        passwordHash: hashedPassword,
        failedLoginAttempts: 0,
      });

      // 3. Test successful login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login/email')
        .send({
          email: 'test@example.com',
          password: 'ValidPassword123!',
        })
        .expect(201);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.accessToken).toBeDefined();
      expect(loginResponse.body.refreshToken).toBeDefined();
      expect(loginResponse.body.userEmail).toBe('test@example.com');

      // 4. Test failed login
      const failedLoginResponse = await request(app.getHttpServer())
        .post('/auth/login/email')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      // 5. Test forgot password
      const forgotPasswordResponse = await request(app.getHttpServer())
        .post('/auth/password/forgot')
        .send({
          email: 'test@example.com',
        })
        .expect(201);

      expect(forgotPasswordResponse.body.success).toBe(true);
      expect(forgotPasswordResponse.body.message).toBe('If the email exists, a reset link will be sent.');

      // 6. Test change password (would require authentication in real app)
      // This is just testing the endpoint structure
      const changePasswordResponse = await request(app.getHttpServer())
        .post('/auth/password/change')
        .send({
          userId: user.id,
          currentPassword: 'ValidPassword123!',
          newPassword: 'NewPassword456!',
        })
        .expect(201);

      expect(changePasswordResponse.body.success).toBe(true);
      expect(changePasswordResponse.body.message).toBe('Password changed successfully');
    });

    it('should handle non-existent user login gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login/email')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login/email')
        .send({
          email: 'invalid-email',
          password: 'ValidPassword123!',
        })
        .expect(400);

      expect(response.body.message).toContain('email must be an email');
    });

    it('should validate password minimum length', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login/email')
        .send({
          email: 'test@example.com',
          password: 'short',
        })
        .expect(400);

      expect(response.body.message).toContain('password must be longer than or equal to 8 characters');
    });

    it('should handle account lockout after multiple failed attempts', async () => {
      // Create test account and user
      const account = await accountModel.create(testAccount);
      const hashedPassword = await passwordService.hashPassword('ValidPassword123!');
      await accountUserModel.create({
        ...testUser,
        accountId: account.id,
        passwordHash: hashedPassword,
        failedLoginAttempts: 0,
      });

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login/email')
          .send({
            email: 'test@example.com',
            password: 'WrongPassword123!',
          })
          .expect(401);
      }

      // Next attempt should be locked
      const lockedResponse = await request(app.getHttpServer())
        .post('/auth/login/email')
        .send({
          email: 'test@example.com',
          password: 'ValidPassword123!', // Even correct password should fail
        })
        .expect(401);

      expect(lockedResponse.body.message).toBe('Account is temporarily locked due to failed login attempts.');
    });
  });

  describe('Password Management Flow', () => {
    it('should handle password change with invalid current password', async () => {
      // Create test account and user
      const account = await accountModel.create(testAccount);
      const hashedPassword = await passwordService.hashPassword('ValidPassword123!');
      const user = await accountUserModel.create({
        ...testUser,
        accountId: account.id,
        passwordHash: hashedPassword,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/password/change')
        .send({
          userId: user.id,
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456!',
        })
        .expect(401);

      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should validate new password policy', async () => {
      // Create test account and user
      const account = await accountModel.create(testAccount);
      const hashedPassword = await passwordService.hashPassword('ValidPassword123!');
      const user = await accountUserModel.create({
        ...testUser,
        accountId: account.id,
        passwordHash: hashedPassword,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/password/change')
        .send({
          userId: user.id,
          currentPassword: 'ValidPassword123!',
          newPassword: 'weak',
        })
        .expect(401);

      expect(response.body.message).toContain('New password does not meet policy');
    });

    it('should require userId for password change', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/password/change')
        .send({
          currentPassword: 'ValidPassword123!',
          newPassword: 'NewPassword456!',
        })
        .expect(500); // This will throw an error due to missing userId

      expect(response.body.message).toBe('userId is required');
    });
  });
}); 