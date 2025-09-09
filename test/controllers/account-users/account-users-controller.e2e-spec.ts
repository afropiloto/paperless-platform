import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS, TEST_PERMISSIONS } from '../../fixtures/test-data';

describe('Account Users Controller (e2e)', () => {
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

  describe('POST /api/account-users/account/:accountId', () => {
    it('should create account user successfully', async () => {
      // Create test account
      const account = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const userData = {
        name: 'New Test User',
        emailAddress: 'new-user@test.com',
        walletAddress: '0x1234567890123456789012345678901234567890',
        status: 'Active',
        permissions: [TEST_PERMISSIONS.DEAL_DESK_AGENT],
        authMethod: 'email-password'
      };

      const response = await testSuite.getRequest()
        .post(`/api/account-users/account/${account._id}`)
        .send(userData)
        .expect(201);

      expect(response.body.name).toBe(userData.name);
      expect(response.body.emailAddress).toBe(userData.emailAddress);
      expect(response.body.walletAddress).toBe(userData.walletAddress);
      expect(response.body.status).toBe(userData.status);
      expect(response.body.permissions).toEqual(userData.permissions);
    });

    it('should validate required fields', async () => {
      const account = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const response = await testSuite.getRequest()
        .post(`/api/account-users/account/${account._id}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('name should not be empty');
      expect(response.body.message).toContain('emailAddress should not be empty');
    });

    it('should validate email format', async () => {
      const account = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const userData = {
        name: 'Test User',
        emailAddress: 'invalid-email',
        walletAddress: '0x1234567890123456789012345678901234567890',
        status: 'Active',
        permissions: [TEST_PERMISSIONS.DEAL_DESK_AGENT],
        authMethod: 'email-password'
      };

      const response = await testSuite.getRequest()
        .post(`/api/account-users/account/${account._id}`)
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('emailAddress must be an email');
    });

    it('should return 404 for non-existent account', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const userData = {
        name: 'Test User',
        emailAddress: 'test@example.com',
        walletAddress: '0x1234567890123456789012345678901234567890',
        status: 'Active',
        permissions: [TEST_PERMISSIONS.DEAL_DESK_AGENT],
        authMethod: 'email-password'
      };

      const response = await testSuite.getRequest()
        .post(`/api/account-users/account/${nonExistentId}`)
        .send(userData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/account-users/account/:accountId', () => {
    it('should get users by account ID successfully', async () => {
      // Create test account with users
      const { account, user } = await testSuite.createTestAccountWithUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/account-users/account/${account._id}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].name).toBe(user.name);
    });

    it('should handle pagination', async () => {
      const { account } = await testSuite.createTestAccountWithUser(TEST_ACCOUNTS.BASIC, TEST_USERS.BASIC);

      const response = await testSuite.getRequest()
        .get(`/api/account-users/account/${account._id}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle search parameters', async () => {
      const { account, user } = await testSuite.createTestAccountWithUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/account-users/account/${account._id}`)
        .query({ search: user.name })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/account-users/:id', () => {
    it('should get user by ID successfully', async () => {
      const { account, user } = await testSuite.createTestAccountWithUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/account-users/${user._id}`)
        .expect(200);

      expect(response.body.name).toBe(user.name);
      expect(response.body.emailAddress).toBe(user.emailAddress);
      expect(response.body.status).toBe(user.status);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/account-users/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/account-users/wallet/:walletAddress', () => {
    it('should get user by wallet address successfully', async () => {
      const { account, user } = await testSuite.createTestAccountWithUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.WALLET_USER
      );

      const response = await testSuite.getRequest()
        .get(`/api/account-users/wallet/${user.walletAddress}`)
        .expect(200);

      expect(response.body.name).toBe(user.name);
      expect(response.body.walletAddress).toBe(user.walletAddress);
    });

    it('should return 404 for non-existent wallet address', async () => {
      const response = await testSuite.getRequest()
        .get('/api/account-users/wallet/0x0000000000000000000000000000000000000000')
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PATCH /api/account-users/:id', () => {
    it('should update user successfully', async () => {
      const { account, user } = await testSuite.createTestAccountWithUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const updateData = {
        name: 'Updated User Name',
        status: 'Inactive',
        permissions: [TEST_PERMISSIONS.DEAL_DESK_ADMIN]
      };

      const response = await testSuite.getRequest()
        .patch(`/api/account-users/${user._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.permissions).toEqual(updateData.permissions);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .patch(`/api/account-users/${nonExistentId}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/account-users/permissions/modules', () => {
    it('should get available modules successfully', async () => {
      const response = await testSuite.getRequest()
        .get('/api/account-users/permissions/modules')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/account-users/permissions/roles', () => {
    it('should get available roles successfully', async () => {
      const response = await testSuite.getRequest()
        .get('/api/account-users/permissions/roles')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/account-users/permissions/combinations', () => {
    it('should get permission combinations successfully', async () => {
      const response = await testSuite.getRequest()
        .get('/api/account-users/permissions/combinations')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/account-users/permissions/modules/:moduleId/roles', () => {
    it('should get roles for specific module successfully', async () => {
      const response = await testSuite.getRequest()
        .get('/api/account-users/permissions/modules/DealDesk/roles')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/account-users/permissions/roles/:roleId/modules', () => {
    it('should get modules for specific role successfully', async () => {
      const response = await testSuite.getRequest()
        .get('/api/account-users/permissions/roles/Agent/modules')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
