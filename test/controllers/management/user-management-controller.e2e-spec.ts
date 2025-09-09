import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS, TEST_PERMISSIONS } from '../../fixtures/test-data';

describe('User Management Controller (e2e)', () => {
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

  describe('POST /api/auth/users', () => {
    it('should create user successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const userData = {
        name: 'New Test User',
        emailAddress: 'new-user@test.com',
        walletAddress: '0x1234567890123456789012345678901234567890',
        status: 'Active',
        permissions: [TEST_PERMISSIONS.DEAL_DESK_AGENT],
        authMethod: 'email-password',
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.name).toBe(userData.name);
      expect(response.body.emailAddress).toBe(userData.emailAddress);
      expect(response.body.walletAddress).toBe(userData.walletAddress);
      expect(response.body.status).toBe(userData.status);
      expect(response.body.permissions).toEqual(userData.permissions);
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('name should not be empty');
      expect(response.body.message).toContain('emailAddress should not be empty');
      expect(response.body.message).toContain('accountId should not be empty');
    });

    it('should validate email format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const userData = {
        name: 'Test User',
        emailAddress: 'invalid-email',
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('emailAddress must be an email');
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const userData = {
        name: 'Test User',
        emailAddress: 'test@example.com',
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(userData)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const userData = {
        name: 'Test User',
        emailAddress: 'test@example.com',
        accountId: account._id.toString()
      };

      await testSuite.getRequest()
        .post('/api/auth/users')
        .send(userData)
        .expect(401);
    });
  });

  describe('POST /api/auth/users/bulk', () => {
    it('should create multiple users successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const bulkUserData = {
        users: [
          {
            name: 'Bulk User 1',
            emailAddress: 'bulk-user-1@test.com',
            walletAddress: '0x1111111111111111111111111111111111111111',
            status: 'Active',
            permissions: [TEST_PERMISSIONS.DEAL_DESK_AGENT],
            authMethod: 'email-password'
          },
          {
            name: 'Bulk User 2',
            emailAddress: 'bulk-user-2@test.com',
            walletAddress: '0x2222222222222222222222222222222222222222',
            status: 'Active',
            permissions: [TEST_PERMISSIONS.TRADE_DOCUMENTS_VIEWER],
            authMethod: 'email-password'
          }
        ],
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/auth/users/bulk')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(bulkUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(2);
      expect(response.body.failed).toBe(0);
      expect(response.body.results).toBeDefined();
      expect(response.body.results.length).toBe(2);
    });

    it('should handle partial failures in bulk creation', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const bulkUserData = {
        users: [
          {
            name: 'Valid User',
            emailAddress: 'valid-user@test.com',
            walletAddress: '0x1111111111111111111111111111111111111111',
            status: 'Active',
            permissions: [TEST_PERMISSIONS.DEAL_DESK_AGENT],
            authMethod: 'email-password'
          },
          {
            name: 'Invalid User',
            emailAddress: 'invalid-email', // Invalid email
            walletAddress: '0x2222222222222222222222222222222222222222',
            status: 'Active',
            permissions: [TEST_PERMISSIONS.DEAL_DESK_AGENT],
            authMethod: 'email-password'
          }
        ],
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/auth/users/bulk')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(bulkUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(1);
      expect(response.body.failed).toBe(1);
      expect(response.body.results).toBeDefined();
    });

    it('should validate users array', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const bulkUserData = {
        users: [], // Empty array
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/auth/users/bulk')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(bulkUserData)
        .expect(400);

      expect(response.body.message).toContain('users should not be empty');
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const bulkUserData = {
        users: [
          {
            name: 'Test User',
            emailAddress: 'test@example.com',
            status: 'Active'
          }
        ],
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/auth/users/bulk')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(bulkUserData)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('POST /api/auth/users/invite', () => {
    it('should invite user successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const inviteData = {
        emailAddress: 'invited-user@test.com',
        name: 'Invited User',
        permissions: [TEST_PERMISSIONS.DEAL_DESK_AGENT],
        accountId: account._id.toString(),
        invitedBy: user._id.toString(),
        invitationMessage: 'Welcome to our platform!'
      };

      const response = await testSuite.getRequest()
        .post('/api/auth/users/invite')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(inviteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.emailAddress).toBe(inviteData.emailAddress);
      expect(response.body.invitationToken).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();
    });

    it('should validate required fields for invitation', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .post('/api/auth/users/invite')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('emailAddress should not be empty');
      expect(response.body.message).toContain('accountId should not be empty');
    });

    it('should validate email format for invitation', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const inviteData = {
        emailAddress: 'invalid-email',
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/auth/users/invite')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(inviteData)
        .expect(400);

      expect(response.body.message).toContain('emailAddress must be an email');
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const inviteData = {
        emailAddress: 'invited-user@test.com',
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/auth/users/invite')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(inviteData)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('PUT /api/auth/users/status', () => {
    it('should update user status successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // Create a user to update
      const userData = {
        name: 'Test User',
        emailAddress: 'test-user@test.com',
        walletAddress: '0x1234567890123456789012345678901234567890',
        status: 'Active',
        permissions: [TEST_PERMISSIONS.DEAL_DESK_AGENT],
        authMethod: 'email-password',
        accountId: account._id.toString()
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(userData)
        .expect(201);

      const userId = createResponse.body._id;

      // Update status
      const statusData = {
        userId,
        status: 'Inactive',
        updatedBy: user._id.toString(),
        reason: 'User requested account suspension'
      };

      const response = await testSuite.getRequest()
        .put('/api/auth/users/status')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe(statusData.status);
    });

    it('should validate status values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const statusData = {
        userId: '507f1f77bcf86cd799439011',
        status: 'InvalidStatus', // Invalid status
        updatedBy: user._id.toString()
      };

      const response = await testSuite.getRequest()
        .put('/api/auth/users/status')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(statusData)
        .expect(400);

      expect(response.body.message).toContain('status must be one of the following values');
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const statusData = {
        userId: '507f1f77bcf86cd799439011',
        status: 'Inactive',
        updatedBy: user._id.toString()
      };

      const response = await testSuite.getRequest()
        .put('/api/auth/users/status')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(statusData)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/auth/users/search', () => {
    it('should search users successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get('/api/auth/users/search')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ search: 'test', accountId: account._id.toString() })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle pagination for user search', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get('/api/auth/users/search')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ 
          search: 'test', 
          accountId: account._id.toString(),
          page: 1, 
          limit: 10 
        })
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should filter by status', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get('/api/auth/users/search')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ 
          accountId: account._id.toString(),
          status: 'Active'
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should filter by permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get('/api/auth/users/search')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ 
          accountId: account._id.toString(),
          module: 'DealDesk',
          role: 'Agent'
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should require authentication', async () => {
      await testSuite.getRequest()
        .get('/api/auth/users/search')
        .query({ search: 'test' })
        .expect(401);
    });
  });

  describe('GET /api/auth/users/:id', () => {
    it('should get user by ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get(`/api/auth/users/${user._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.name).toBe(user.name);
      expect(response.body.emailAddress).toBe(user.emailAddress);
      expect(response.body.status).toBe(user.status);
    });

    it('should return 404 for non-existent user', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/auth/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const userId = '507f1f77bcf86cd799439011';
      
      await testSuite.getRequest()
        .get(`/api/auth/users/${userId}`)
        .expect(401);
    });
  });
});
