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

  describe('POST /api/accounts', () => {
    it('should create account successfully', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const accountData = {
        accountName: 'New Test Account',
        contact: {
          emailAddress: 'contact@newaccount.com',
          phoneNumber: '+1-555-0123'
        },
        status: 'Active',
        businessType: 'Trading Company',
        address: {
          street: '123 Business Street',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'United States'
        },
        metadata: {
          createdBy: user._id.toString(),
          industry: 'Trade Finance',
          size: 'Medium'
        }
      };

      const response = await testSuite.getRequest()
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(accountData)
        .expect(201);

      expect(response.body.accountName).toBe(accountData.accountName);
      expect(response.body.contact.emailAddress).toBe(accountData.contact.emailAddress);
      expect(response.body.status).toBe(accountData.status);
      expect(response.body.businessType).toBe(accountData.businessType);
    });

    it('should validate required fields', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('accountName should not be empty');
      expect(response.body.message).toContain('contact should not be empty');
    });

    it('should validate contact email format', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const accountData = {
        accountName: 'Test Account',
        contact: {
          emailAddress: 'invalid-email', // Invalid email format
          phoneNumber: '+1-555-0123'
        }
      };

      const response = await testSuite.getRequest()
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(accountData)
        .expect(400);

      expect(response.body.message).toContain('contact.emailAddress must be an email');
    });

    it('should validate business type values', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const accountData = {
        accountName: 'Test Account',
        contact: {
          emailAddress: 'contact@test.com',
          phoneNumber: '+1-555-0123'
        },
        businessType: 'InvalidType' // Invalid business type
      };

      const response = await testSuite.getRequest()
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(accountData)
        .expect(400);

      expect(response.body.message).toContain('businessType must be one of the following values');
    });

    it('should require admin permissions', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const accountData = {
        accountName: 'Test Account',
        contact: {
          emailAddress: 'contact@test.com',
          phoneNumber: '+1-555-0123'
        }
      };

      const response = await testSuite.getRequest()
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(accountData)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const accountData = {
        accountName: 'Test Account',
        contact: {
          emailAddress: 'contact@test.com',
          phoneNumber: '+1-555-0123'
        }
      };

      await testSuite.getRequest()
        .post('/api/accounts')
        .send(accountData)
        .expect(401);
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should get account by ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/accounts/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.accountName).toBe(account.accountName);
      expect(response.body.contact.emailAddress).toBe(account.contact.emailAddress);
      expect(response.body.status).toBe(account.status);
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/accounts/${nonExistentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const accountId = '507f1f77bcf86cd799439011';
      
      await testSuite.getRequest()
        .get(`/api/accounts/${accountId}`)
        .expect(401);
    });
  });

  describe('GET /api/accounts', () => {
    it('should get all accounts successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // Create additional accounts
      const accountData1 = {
        accountName: 'Test Account 1',
        contact: {
          emailAddress: 'contact1@test.com',
          phoneNumber: '+1-555-0123'
        }
      };

      const accountData2 = {
        accountName: 'Test Account 2',
        contact: {
          emailAddress: 'contact2@test.com',
          phoneNumber: '+1-555-0124'
        }
      };

      await testSuite.getRequest()
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(accountData1)
        .expect(201);

      await testSuite.getRequest()
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(accountData2)
        .expect(201);

      const response = await testSuite.getRequest()
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3); // Including the original account
    });

    it('should handle pagination for accounts', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle search parameters', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ search: 'Test', status: 'Active' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should handle filtering by business type', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ businessType: 'Trading Company' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const response = await testSuite.getRequest()
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      await testSuite.getRequest()
        .get('/api/accounts')
        .expect(401);
    });
  });

  describe('PATCH /api/accounts/:id', () => {
    it('should update account successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const updateData = {
        accountName: 'Updated Account Name',
        status: 'Inactive',
        contact: {
          emailAddress: 'updated@test.com',
          phoneNumber: '+1-555-9999'
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          updatedBy: user._id.toString(),
          reason: 'Account information updated'
        }
      };

      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.accountName).toBe(updateData.accountName);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.contact.emailAddress).toBe(updateData.contact.emailAddress);
    });

    it('should validate email format on update', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const updateData = {
        contact: {
          emailAddress: 'invalid-email' // Invalid email format
        }
      };

      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('contact.emailAddress must be an email');
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${nonExistentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ accountName: 'Updated' })
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ accountName: 'Updated' })
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const accountId = '507f1f77bcf86cd799439011';
      
      await testSuite.getRequest()
        .patch(`/api/accounts/${accountId}`)
        .send({ accountName: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should delete account successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .delete(`/api/accounts/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .delete(`/api/accounts/${nonExistentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const response = await testSuite.getRequest()
        .delete(`/api/accounts/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const accountId = '507f1f77bcf86cd799439011';
      
      await testSuite.getRequest()
        .delete(`/api/accounts/${accountId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/accounts/:id/status', () => {
    it('should update account status successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const statusData = {
        status: 'Suspended',
        reason: 'Account suspended for compliance review',
        updatedBy: user._id.toString(),
        updatedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${account._id}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.status).toBe(statusData.status);
      expect(response.body.reason).toBe(statusData.reason);
    });

    it('should validate status values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const statusData = {
        status: 'InvalidStatus', // Invalid status
        reason: 'Test reason'
      };

      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${account._id}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(statusData)
        .expect(400);

      expect(response.body.message).toContain('status must be one of the following values');
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ status: 'Suspended' })
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const response = await testSuite.getRequest()
        .patch(`/api/accounts/${account._id}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ status: 'Suspended' })
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const accountId = '507f1f77bcf86cd799439011';
      
      await testSuite.getRequest()
        .patch(`/api/accounts/${accountId}/status`)
        .send({ status: 'Suspended' })
        .expect(401);
    });
  });
});