import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AccountUser } from '../../src/account-users/schemas/account-user.schema';
import { TestDataFactory } from './test-data-factory';

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  userEmail: string;
  userId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Helper class for authentication-related test operations
 */
export class AuthHelper {
  constructor(
    private app: INestApplication,
    private testDataFactory: TestDataFactory
  ) {}

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/login/email')
      .send({ email, password })
      .expect(201);

    return response.body;
  }

  /**
   * Login with SIWE (wallet)
   */
  async loginWithWallet(address: string, signature: string): Promise<LoginResponse> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/login')
      .send({ address, signature })
      .expect(201);

    return response.body;
  }

  /**
   * Get SIWE nonce for wallet address
   */
  async getNonce(address: string): Promise<string> {
    const response = await request(this.app.getHttpServer())
      .get(`/api/auth/nonce/${address}`)
      .expect(200);

    return response.body.nonce;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    return {
      accessToken: response.body.accessToken,
      refreshToken: response.body.refreshToken,
    };
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    accessToken: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/password/change')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId,
        currentPassword,
        newPassword,
      })
      .expect(201);

    return response.body;
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/password/forgot')
      .send({ email })
      .expect(201);

    return response.body;
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/password/reset')
      .send({ token, newPassword })
      .expect(201);

    return response.body;
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(userId: string, accessToken: string): Promise<{ secret: string; qrCode: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/mfa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ userId })
      .expect(201);

    return response.body;
  }

  /**
   * Verify MFA setup
   */
  async verifyMFASetup(
    userId: string,
    token: string,
    accessToken: string
  ): Promise<{ success: boolean; backupCodes: string[] }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/mfa/verify-setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ userId, token })
      .expect(201);

    return response.body;
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(userId: string, code: string): Promise<{ success: boolean; message: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/mfa/verify')
      .send({ userId, code })
      .expect(201);

    return response.body;
  }

  /**
   * Disable MFA
   */
  async disableMFA(userId: string, accessToken: string): Promise<{ success: boolean; message: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/mfa/disable')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ userId })
      .expect(201);

    return response.body;
  }

  /**
   * Get MFA status
   */
  async getMFAStatus(userId: string, accessToken: string): Promise<{ enabled: boolean; backupCodesCount: number }> {
    const response = await request(this.app.getHttpServer())
      .get('/api/auth/mfa/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ userId })
      .expect(200);

    return response.body;
  }

  /**
   * Create and login a test user
   */
  async createAndLoginUser(
    accountId: string,
    userOverrides: Partial<AccountUser> = {}
  ): Promise<{ user: AccountUser; loginResponse: LoginResponse }> {
    const user = await this.testDataFactory.createUser(accountId, userOverrides);
    const loginResponse = await this.login(user.emailAddress, 'TestPassword123!');
    
    return { user, loginResponse };
  }

  /**
   * Create account, user, and login
   */
  async createAccountUserAndLogin(
    accountOverrides: any = {},
    userOverrides: Partial<AccountUser> = {}
  ): Promise<{ account: any; user: AccountUser; loginResponse: LoginResponse }> {
    const account = await this.testDataFactory.createAccount(accountOverrides);
    const { user, loginResponse } = await this.createAndLoginUser(account._id.toString(), userOverrides);
    
    return { account, user, loginResponse };
  }

  /**
   * Verify that a request requires authentication
   */
  async expectUnauthorized(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', body: any = {}) {
    const req = request(this.app.getHttpServer());
    let response;
    
    switch (method) {
      case 'GET':
        response = req.get(endpoint);
        break;
      case 'POST':
        response = req.post(endpoint).send(body);
        break;
      case 'PUT':
        response = req.put(endpoint).send(body);
        break;
      case 'PATCH':
        response = req.patch(endpoint).send(body);
        break;
      case 'DELETE':
        response = req.delete(endpoint);
        break;
    }

    await response.expect(401);
  }

  /**
   * Verify that a request with valid token succeeds
   */
  async expectAuthorized(
    endpoint: string,
    accessToken: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body: any = {}
  ) {
    const req = request(this.app.getHttpServer()).set('Authorization', `Bearer ${accessToken}`);
    let response;
    
    switch (method) {
      case 'GET':
        response = req.get(endpoint);
        break;
      case 'POST':
        response = req.post(endpoint).send(body);
        break;
      case 'PUT':
        response = req.put(endpoint).send(body);
        break;
      case 'PATCH':
        response = req.patch(endpoint).send(body);
        break;
      case 'DELETE':
        response = req.delete(endpoint);
        break;
    }

    return response;
  }
}
