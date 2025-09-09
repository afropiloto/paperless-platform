import { Model } from 'mongoose';
import { AccountUser } from '../../src/account-users/schemas/account-user.schema';
import { Account } from '../../src/accounts/schemas/account.schema';

/**
 * Helper class for database operations in tests
 */
export class DatabaseHelper {
  constructor(
    private accountModel: Model<Account>,
    private accountUserModel: Model<AccountUser>
  ) {}

  /**
   * Clean up all test data
   */
  async cleanupTestData(): Promise<void> {
    // Clean up test accounts (this will cascade to users due to foreign key constraints)
    await this.accountModel.deleteMany({
      accountName: { $regex: /^Test Account/ }
    });

    // Clean up any remaining test users
    await this.accountUserModel.deleteMany({
      emailAddress: { $regex: /test.*@example\.com$/ }
    });

    // Clean up users with test wallet addresses
    await this.accountUserModel.deleteMany({
      walletAddress: { $regex: /^0x[a-fA-F0-9]{40}$/ }
    });
  }

  /**
   * Clean up specific test data by IDs
   */
  async cleanupTestDataByIds(accountIds: string[], userIds: string[]): Promise<void> {
    if (accountIds.length > 0) {
      await this.accountModel.deleteMany({ _id: { $in: accountIds } });
    }
    
    if (userIds.length > 0) {
      await this.accountUserModel.deleteMany({ _id: { $in: userIds } });
    }
  }

  /**
   * Clean up test data by email patterns
   */
  async cleanupTestDataByEmail(emailPatterns: string[]): Promise<void> {
    const regexPatterns = emailPatterns.map(pattern => new RegExp(pattern));
    await this.accountUserModel.deleteMany({
      emailAddress: { $in: regexPatterns }
    });
  }

  /**
   * Clean up test data by account name patterns
   */
  async cleanupTestDataByAccountName(accountNamePatterns: string[]): Promise<void> {
    const regexPatterns = accountNamePatterns.map(pattern => new RegExp(pattern));
    await this.accountModel.deleteMany({
      accountName: { $in: regexPatterns }
    });
  }

  /**
   * Get count of test accounts
   */
  async getTestAccountCount(): Promise<number> {
    return this.accountModel.countDocuments({
      accountName: { $regex: /^Test Account/ }
    });
  }

  /**
   * Get count of test users
   */
  async getTestUserCount(): Promise<number> {
    return this.accountUserModel.countDocuments({
      emailAddress: { $regex: /test.*@example\.com$/ }
    });
  }

  /**
   * Check if test data exists
   */
  async hasTestData(): Promise<boolean> {
    const accountCount = await this.getTestAccountCount();
    const userCount = await this.getTestUserCount();
    return accountCount > 0 || userCount > 0;
  }

  /**
   * Get all test accounts
   */
  async getTestAccounts(): Promise<Account[]> {
    return this.accountModel.find({
      accountName: { $regex: /^Test Account/ }
    });
  }

  /**
   * Get all test users
   */
  async getTestUsers(): Promise<AccountUser[]> {
    return this.accountUserModel.find({
      emailAddress: { $regex: /test.*@example\.com$/ }
    });
  }

  /**
   * Find account by name pattern
   */
  async findAccountByNamePattern(pattern: string): Promise<Account[]> {
    return this.accountModel.find({
      accountName: { $regex: pattern }
    });
  }

  /**
   * Find user by email pattern
   */
  async findUserByEmailPattern(pattern: string): Promise<AccountUser[]> {
    return this.accountUserModel.find({
      emailAddress: { $regex: pattern }
    });
  }

  /**
   * Find user by wallet address
   */
  async findUserByWalletAddress(walletAddress: string): Promise<AccountUser | null> {
    return this.accountUserModel.findOne({ walletAddress });
  }

  /**
   * Find account by ID
   */
  async findAccountById(accountId: string): Promise<Account | null> {
    return this.accountModel.findById(accountId);
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<AccountUser | null> {
    return this.accountUserModel.findById(userId);
  }

  /**
   * Find users by account ID
   */
  async findUsersByAccountId(accountId: string): Promise<AccountUser[]> {
    return this.accountUserModel.find({ accountId });
  }

  /**
   * Update account status
   */
  async updateAccountStatus(accountId: string, status: string): Promise<Account | null> {
    return this.accountModel.findByIdAndUpdate(
      accountId,
      { status, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: string): Promise<AccountUser | null> {
    return this.accountUserModel.findByIdAndUpdate(
      userId,
      { status, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Update user permissions
   */
  async updateUserPermissions(userId: string, permissions: Array<{ module: string; role: string }>): Promise<AccountUser | null> {
    return this.accountUserModel.findByIdAndUpdate(
      userId,
      { permissions, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLoginAttempts(userId: string): Promise<AccountUser | null> {
    return this.accountUserModel.findByIdAndUpdate(
      userId,
      { $inc: { failedLoginAttempts: 1 }, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Reset failed login attempts
   */
  async resetFailedLoginAttempts(userId: string): Promise<AccountUser | null> {
    return this.accountUserModel.findByIdAndUpdate(
      userId,
      { failedLoginAttempts: 0, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId: string, mfaSecret: string, backupCodes: string[]): Promise<AccountUser | null> {
    return this.accountUserModel.findByIdAndUpdate(
      userId,
      { 
        mfaEnabled: true, 
        mfaSecret, 
        backupCodes, 
        updatedAt: new Date() 
      },
      { new: true }
    );
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string): Promise<AccountUser | null> {
    return this.accountUserModel.findByIdAndUpdate(
      userId,
      { 
        mfaEnabled: false, 
        mfaSecret: undefined, 
        backupCodes: undefined, 
        updatedAt: new Date() 
      },
      { new: true }
    );
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalAccounts: number;
    totalUsers: number;
    testAccounts: number;
    testUsers: number;
    activeAccounts: number;
    activeUsers: number;
  }> {
    const [
      totalAccounts,
      totalUsers,
      testAccounts,
      testUsers,
      activeAccounts,
      activeUsers
    ] = await Promise.all([
      this.accountModel.countDocuments(),
      this.accountUserModel.countDocuments(),
      this.getTestAccountCount(),
      this.getTestUserCount(),
      this.accountModel.countDocuments({ status: 'Active' }),
      this.accountUserModel.countDocuments({ status: 'Active' })
    ]);

    return {
      totalAccounts,
      totalUsers,
      testAccounts,
      testUsers,
      activeAccounts,
      activeUsers
    };
  }
}
