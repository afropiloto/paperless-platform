import { Model } from 'mongoose';
import { AccountUser } from '../../src/account-users/schemas/account-user.schema';
import { Account } from '../../src/accounts/schemas/account.schema';
import { PasswordService } from '../../src/auth/services/password.service';

/**
 * Factory for creating test data consistently across tests
 */
export class TestDataFactory {
  constructor(
    private accountModel: Model<Account>,
    private accountUserModel: Model<AccountUser>,
    private passwordService: PasswordService
  ) {}

  /**
   * Create a test account with default values
   */
  async createAccount(overrides: Partial<Account> = {}): Promise<Account> {
    const defaultAccount = {
      accountName: `Test Account ${Date.now()}`,
      contact: {
        emailAddress: `test-account-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Account',
      },
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const accountData = { ...defaultAccount, ...overrides };
    return this.accountModel.create(accountData);
  }

  /**
   * Create a test user with default values
   */
  async createUser(accountId: string, overrides: Partial<AccountUser> = {}): Promise<AccountUser> {
    const timestamp = Date.now();
    const defaultUser = {
      name: `Test User ${timestamp}`,
      emailAddress: `test-user-${timestamp}@example.com`,
      walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      status: 'Active',
      permissions: [{ module: 'DealDesk', role: 'Agent' }],
      authMethod: 'email-password',
      mfaEnabled: false,
      accountId,
      passwordHash: await this.passwordService.hashPassword('TestPassword123!'),
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userData = { ...defaultUser, ...overrides };
    return this.accountUserModel.create(userData);
  }

  /**
   * Create multiple test users for the same account
   */
  async createUsers(accountId: string, count: number, overrides: Partial<AccountUser> = {}): Promise<AccountUser[]> {
    const users: AccountUser[] = [];
    for (let i = 0; i < count; i++) {
      const user = await this.createUser(accountId, {
        ...overrides,
        name: `Test User ${i + 1} ${Date.now()}`,
        emailAddress: `test-user-${i + 1}-${Date.now()}@example.com`,
      });
      users.push(user);
    }
    return users;
  }

  /**
   * Create a user with specific permissions
   */
  async createUserWithPermissions(
    accountId: string,
    permissions: Array<{ module: string; role: string }>,
    overrides: Partial<AccountUser> = {}
  ): Promise<AccountUser> {
    return this.createUser(accountId, {
      ...overrides,
      permissions,
    });
  }

  /**
   * Create a user with MFA enabled
   */
  async createUserWithMFA(accountId: string, overrides: Partial<AccountUser> = {}): Promise<AccountUser> {
    return this.createUser(accountId, {
      ...overrides,
      mfaEnabled: true,
      mfaSecret: 'test-mfa-secret',
      backupCodes: ['123456', '789012', '345678', '901234', '567890'],
    });
  }

  /**
   * Create a user with specific auth method
   */
  async createUserWithAuthMethod(
    accountId: string,
    authMethod: 'email-password' | 'wallet',
    overrides: Partial<AccountUser> = {}
  ): Promise<AccountUser> {
    return this.createUser(accountId, {
      ...overrides,
      authMethod,
    });
  }

  /**
   * Create a user with wallet authentication
   */
  async createWalletUser(accountId: string, walletAddress: string, overrides: Partial<AccountUser> = {}): Promise<AccountUser> {
    return this.createUser(accountId, {
      ...overrides,
      authMethod: 'wallet',
      walletAddress,
      passwordHash: undefined, // Wallet users don't have passwords
    });
  }

  /**
   * Create test data for trade documents
   */
  createTradeDocumentData(overrides: any = {}) {
    return {
      title: `Test Document ${Date.now()}`,
      description: 'Test document description',
      documentType: 'Invoice',
      status: 'Draft',
      metadata: {
        amount: 1000,
        currency: 'USD',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      ...overrides,
    };
  }

  /**
   * Create test data for deals
   */
  createDealData(overrides: any = {}) {
    return {
      dealName: `Test Deal ${Date.now()}`,
      dealType: 'Invoice Financing',
      amount: 50000,
      currency: 'USD',
      status: 'Pending',
      description: 'Test deal description',
      ...overrides,
    };
  }

  /**
   * Create test data for onboarding
   */
  createOnboardingData(overrides: any = {}) {
    return {
      customerName: `Test Customer ${Date.now()}`,
      customerEmail: `customer-${Date.now()}@example.com`,
      status: 'Pending',
      documents: [],
      ...overrides,
    };
  }

  /**
   * Create test data for due diligence checklists
   */
  createChecklistData(overrides: any = {}) {
    return {
      checklistType: 'KYC',
      version: '1.0',
      items: [
        { id: '1', description: 'Identity verification', completed: false },
        { id: '2', description: 'Address verification', completed: false },
        { id: '3', description: 'Financial verification', completed: false },
      ],
      ...overrides,
    };
  }

  /**
   * Create test data for named wallets
   */
  createNamedWalletData(overrides: any = {}) {
    return {
      name: `Test Wallet ${Date.now()}`,
      walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      walletType: 'Ethereum',
      description: 'Test wallet description',
      ...overrides,
    };
  }

  /**
   * Create test file data for uploads
   */
  createFileData(filename: string = 'test-document.pdf', content: string = 'test file content') {
    return {
      fieldname: 'file',
      originalname: filename,
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.from(content),
      size: content.length,
    };
  }
}
