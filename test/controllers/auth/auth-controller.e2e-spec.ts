import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS, TEST_PASSWORDS, TEST_EMAILS } from '../../fixtures/test-data';

describe('Auth Controller (e2e)', () => {
  let testSuite: BaseE2ETest;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.beforeAll();
  });

  beforeEach(async () => {
    await testSuite.beforeEach();
  });

  afterEach(async () => {
    await testSuite.afterEach();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  describe('Email/Password Authentication', () => {
    it('should login successfully with valid credentials', async () => {
      // Create test account and user
      const { account, user } = await testSuite.createTestAccountWithUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Login
      const loginResponse = await testSuite.login(user.emailAddress, 'TestPassword123!');

      expect(loginResponse.success).toBe(true);
      expect(loginResponse.accessToken).toBeDefined();
      expect(loginResponse.refreshToken).toBeDefined();
      expect(loginResponse.userEmail).toBe(user.emailAddress);
    });

    it('should fail login with invalid credentials', async () => {
      // Create test account and user
      const { account, user } = await testSuite.createTestAccountWithUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Attempt login with wrong password
      const response = await testSuite.getRequest()
        .post('/api/auth/login/email')
        .send({
          email: user.emailAddress,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail login with non-existent user', async () => {
      const response = await testSuite.getRequest()
        .post('/api/auth/login/email')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!'
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should validate email format', async () => {
      const response = await testSuite.getRequest()
        .post('/api/auth/login/email')
        .send({
          email: TEST_EMAILS.INVALID,
          password: TEST_PASSWORDS.VALID
        })
        .expect(400);

      expect(response.body.message).toContain('email must be an email');
    });

    it('should validate password requirements', async () => {
      const response = await testSuite.getRequest()
        .post('/api/auth/login/email')
        .send({
          email: TEST_EMAILS.VALID,
          password: TEST_PASSWORDS.WEAK
        })
        .expect(400);

      expect(response.body.message).toContain('password must be longer than or equal to 8 characters');
    });
  });

  describe('Password Management', () => {
    it('should change password successfully', async () => {
      // Create test account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Change password
      const changeResponse = await testSuite.authHelper.changePassword(
        user._id.toString(),
        'TestPassword123!',
        'NewPassword456!',
        token.accessToken
      );

      expect(changeResponse.success).toBe(true);
      expect(changeResponse.message).toBe('Password changed successfully');
    });

    it('should fail password change with incorrect current password', async () => {
      // Create test account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Attempt password change with wrong current password
      const response = await testSuite.getRequest()
        .post('/api/auth/password/change')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          userId: user._id.toString(),
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456!'
        })
        .expect(401);

      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should handle forgot password', async () => {
      // Create test account and user
      const { account, user } = await testSuite.createTestAccountWithUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Request password reset
      const forgotResponse = await testSuite.authHelper.forgotPassword(user.emailAddress);

      expect(forgotResponse.success).toBe(true);
      expect(forgotResponse.message).toBe('If the email exists, a reset link will be sent.');
    });
  });

  describe('MFA (Multi-Factor Authentication)', () => {
    it('should setup MFA successfully', async () => {
      // Create test account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Setup MFA
      const mfaResponse = await testSuite.authHelper.setupMFA(
        user._id.toString(),
        token.accessToken
      );

      expect(mfaResponse.secret).toBeDefined();
      expect(mfaResponse.qrCode).toBeDefined();
    });

    it('should get MFA status', async () => {
      // Create test account and user with MFA
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.MFA_USER
      );

      // Get MFA status
      const statusResponse = await testSuite.authHelper.getMFAStatus(
        user._id.toString(),
        token.accessToken
      );

      expect(statusResponse.enabled).toBe(true);
      expect(statusResponse.backupCodesCount).toBeGreaterThan(0);
    });
  });

  describe('Token Management', () => {
    it('should refresh access token', async () => {
      // Create test account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Refresh token
      const refreshResponse = await testSuite.authHelper.refreshToken(token.refreshToken);

      expect(refreshResponse.accessToken).toBeDefined();
      expect(refreshResponse.refreshToken).toBeDefined();
      expect(refreshResponse.accessToken).not.toBe(token.accessToken);
    });

    it('should fail refresh with invalid token', async () => {
      const response = await testSuite.getRequest()
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Authorization', () => {
    it('should require authentication for protected endpoints', async () => {
      await testSuite.authHelper.expectUnauthorized('/api/auth/password/change', 'POST', {
        userId: 'test-id',
        currentPassword: 'test',
        newPassword: 'test'
      });
    });

    it('should allow access with valid token', async () => {
      // Create test account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Test protected endpoint
      const response = await testSuite.authHelper.expectAuthorized(
        '/api/auth/mfa/status',
        token.accessToken,
        'GET'
      );

      expect(response.status).not.toBe(401);
    });
  });
});
