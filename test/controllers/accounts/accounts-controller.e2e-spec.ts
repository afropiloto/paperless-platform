import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';

describe('Accounts Controller (e2e)', () => {
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

  describe('GET /api/accounts/:accountId', () => {
    it('should get account by ID successfully', async () => {
      // Create test account
      const account = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      // Get account
      const response = await testSuite.getRequest()
        .get(`/api/accounts/${account._id}`)
        .expect(200);

      expect(response.body.accountName).toBe(account.accountName);
      expect(response.body.contact.emailAddress).toBe(account.contact.emailAddress);
      expect(response.body.status).toBe(account.status);
    });

    it('should return 404 for non-existent account', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      
      const response = await testSuite.getRequest()
        .get(`/api/accounts/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for invalid account ID format', async () => {
      const response = await testSuite.getRequest()
        .get('/api/accounts/invalid-id')
        .expect(400);

      expect(response.body.message).toContain('Invalid ID format');
    });
  });

  describe('GET /api/accounts', () => {
    it('should get all accounts with pagination', async () => {
      // Create multiple test accounts
      const account1 = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);
      const account2 = await testSuite.createTestAccount({
        ...TEST_ACCOUNTS.BASIC,
        accountName: 'Another Test Account'
      });

      // Get accounts with pagination
      const response = await testSuite.getRequest()
        .get('/api/accounts')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle search parameters', async () => {
      // Create test account
      const account = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      // Search for account
      const response = await testSuite.getRequest()
        .get('/api/accounts')
        .query({ search: 'Test Account' })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle sorting parameters', async () => {
      // Create test accounts
      const account1 = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);
      const account2 = await testSuite.createTestAccount({
        ...TEST_ACCOUNTS.BASIC,
        accountName: 'Another Test Account'
      });

      // Sort by account name
      const response = await testSuite.getRequest()
        .get('/api/accounts')
        .query({ sortBy: 'accountName', sortOrder: 'asc' })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /api/accounts', () => {
    it('should create account successfully', async () => {
      const accountData = {
        accountName: 'New Test Account',
        contact: {
          emailAddress: 'new-account@test.com',
          firstName: 'New',
          lastName: 'Account'
        },
        status: 'Active'
      };

      const response = await testSuite.getRequest()
        .post('/api/accounts')
        .send(accountData)
        .expect(201);

      expect(response.body.accountName).toBe(accountData.accountName);
      expect(response.body.contact.emailAddress).toBe(accountData.contact.emailAddress);
      expect(response.body.status).toBe(accountData.status);
    });

    it('should validate required fields', async () => {
      const response = await testSuite.getRequest()
        .post('/api/accounts')
        .send({})
        .expect(400);

      expect(response.body.message).toContain('accountName should not be empty');
      expect(response.body.message).toContain('contact should not be empty');
    });

    it('should validate email format', async () => {
      const accountData = {
        accountName: 'Test Account',
        contact: {
          emailAddress: 'invalid-email',
          firstName: 'Test',
          lastName: 'Account'
        },
        status: 'Active'
      };

      const response = await testSuite.getRequest()
        .post('/api/accounts')
        .send(accountData)
        .expect(400);

      expect(response.body.message).toContain('emailAddress must be an email');
    });
  });

  describe('PATCH /api/accounts/:id', () => {
    it('should update account successfully', async () => {
      // Create test account
      const account = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const updateData = {
        accountName: 'Updated Test Account',
        contact: {
          emailAddress: 'updated@test.com',
          firstName: 'Updated',
          lastName: 'Account'
        }
      };

      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${account._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.accountName).toBe(updateData.accountName);
      expect(response.body.contact.emailAddress).toBe(updateData.contact.emailAddress);
    });

    it('should return 404 for non-existent account', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${nonExistentId}`)
        .send({ accountName: 'Updated' })
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PATCH /api/accounts/:id/status', () => {
    it('should update account status successfully', async () => {
      // Create test account
      const account = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${account._id}/status`)
        .send({ status: 'Inactive' })
        .expect(200);

      expect(response.body.status).toBe('Inactive');
    });

    it('should validate status values', async () => {
      // Create test account
      const account = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${account._id}/status`)
        .send({ status: 'InvalidStatus' })
        .expect(400);

      expect(response.body.message).toContain('status must be one of the following values');
    });
  });
});
