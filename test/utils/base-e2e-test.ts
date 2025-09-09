import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AccountUser } from '../../src/account-users/schemas/account-user.schema';
import { Account } from '../../src/accounts/schemas/account.schema';
import { PasswordService } from '../../src/auth/services/password.service';
import { TestDataFactory } from './test-data-factory';
import { AuthHelper } from './auth-helper';
import { ApiHelper } from './api-helper';
import { DatabaseHelper } from './database-helper';

/**
 * Base class for all E2E tests
 * Provides common setup, teardown, and utility methods
 */
export abstract class BaseE2ETest {
  protected app: INestApplication;
  protected accountUserModel: Model<AccountUser>;
  protected accountModel: Model<Account>;
  protected passwordService: PasswordService;
  public testDataFactory: TestDataFactory;
  public authHelper: AuthHelper;
  public apiHelper: ApiHelper;
  public databaseHelper: DatabaseHelper;

  // Test data that will be cleaned up after each test
  protected testAccounts: Account[] = [];
  protected testUsers: AccountUser[] = [];

  async beforeAll(): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.accountUserModel = moduleFixture.get<Model<AccountUser>>(getModelToken(AccountUser.name));
    this.accountModel = moduleFixture.get<Model<Account>>(getModelToken(Account.name));
    this.passwordService = moduleFixture.get<PasswordService>(PasswordService);

    // Initialize helpers
    this.testDataFactory = new TestDataFactory(this.accountModel, this.accountUserModel, this.passwordService);
    this.authHelper = new AuthHelper(this.app, this.testDataFactory);
    this.apiHelper = new ApiHelper(this.app);
    this.databaseHelper = new DatabaseHelper(this.accountModel, this.accountUserModel);

    await this.app.init();
  }

  async beforeEach(): Promise<void> {
    // Clean up any existing test data
    await this.databaseHelper.cleanupTestData();
    this.testAccounts = [];
    this.testUsers = [];
  }

  async afterEach(): Promise<void> {
    // Clean up test data created during the test
    await this.databaseHelper.cleanupTestData();
  }

  async afterAll(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  /**
   * Create a test account and return it
   */
  public async createTestAccount(overrides: Partial<Account> = {}): Promise<Account> {
    const account = await this.testDataFactory.createAccount(overrides);
    this.testAccounts.push(account);
    return account;
  }

  /**
   * Create a test user and return it
   */
  public async createTestUser(accountId: string, overrides: Partial<AccountUser> = {}): Promise<AccountUser> {
    const user = await this.testDataFactory.createUser(accountId, overrides);
    this.testUsers.push(user);
    return user;
  }

  /**
   * Create a test account with a user and return both
   */
  public async createTestAccountWithUser(
    accountOverrides: Partial<Account> = {},
    userOverrides: Partial<AccountUser> = {}
  ): Promise<{ account: Account; user: AccountUser }> {
    const account = await this.createTestAccount(accountOverrides);
    const user = await this.createTestUser(account._id.toString(), userOverrides);
    return { account, user };
  }

  /**
   * Get authenticated request helper
   */
  public getAuthenticatedRequest(user: AccountUser) {
    return this.apiHelper.getAuthenticatedRequest(user);
  }

  /**
   * Get unauthenticated request helper
   */
  public getRequest() {
    return this.apiHelper.getRequest();
  }

  /**
   * Login and get JWT token
   */
  public async login(email: string, password: string) {
    return this.authHelper.login(email, password);
  }

  /**
   * Create and login a test user, returning both user and token
   */
  public async createAndLoginUser(
    accountOverrides: Partial<Account> = {},
    userOverrides: Partial<AccountUser> = {}
  ) {
    const { account, user } = await this.createTestAccountWithUser(accountOverrides, userOverrides);
    const token = await this.authHelper.login(user.emailAddress, 'TestPassword123!');
    return { account, user, token };
  }
}
