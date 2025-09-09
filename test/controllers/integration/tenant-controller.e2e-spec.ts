import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';

describe('Tenant Controller (e2e)', () => {
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

  describe('GET /api/tenant/:accountId', () => {
    it('should get tenant configuration successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get(`/api/tenant/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.accountId).toBe(account._id.toString());
      expect(response.body.configuration).toBeDefined();
      expect(response.body.did).toBeDefined();
      expect(response.body.status).toBeDefined();
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const nonExistentAccountId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/tenant/${nonExistentAccountId}`)
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
        .get(`/api/tenant/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      await testSuite.getRequest()
        .get(`/api/tenant/${account._id}`)
        .expect(401);
    });
  });

  describe('PUT /api/tenant/:accountId', () => {
    it('should update tenant configuration successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const updateData = {
        configuration: {
          theme: 'dark',
          language: 'en-US',
          timezone: 'America/New_York',
          features: {
            documentSigning: true,
            tradeFinance: true,
            analytics: false
          },
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          updatedBy: user._id.toString(),
          version: '2.0'
        }
      };

      const response = await testSuite.getRequest()
        .put(`/api/tenant/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.configuration).toEqual(updateData.configuration);
      expect(response.body.metadata).toEqual(updateData.metadata);
    });

    it('should validate configuration structure', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const updateData = {
        configuration: {
          theme: 'invalid-theme' // Invalid theme value
        }
      };

      const response = await testSuite.getRequest()
        .put(`/api/tenant/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('theme must be one of the following values');
    });

    it('should validate language format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const updateData = {
        configuration: {
          language: 'invalid-language' // Invalid language format
        }
      };

      const response = await testSuite.getRequest()
        .put(`/api/tenant/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('language must be a valid language code');
    });

    it('should validate timezone format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const updateData = {
        configuration: {
          timezone: 'invalid-timezone' // Invalid timezone
        }
      };

      const response = await testSuite.getRequest()
        .put(`/api/tenant/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('timezone must be a valid timezone');
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const nonExistentAccountId = '507f1f77bcf86cd799439011';
      
      const updateData = {
        configuration: {
          theme: 'light'
        }
      };

      const response = await testSuite.getRequest()
        .put(`/api/tenant/${nonExistentAccountId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const updateData = {
        configuration: {
          theme: 'light'
        }
      };

      const response = await testSuite.getRequest()
        .put(`/api/tenant/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const updateData = {
        configuration: {
          theme: 'light'
        }
      };

      await testSuite.getRequest()
        .put(`/api/tenant/${account._id}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('GET /api/tenant/:accountId/did', () => {
    it('should get tenant DID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.did).toBeDefined();
      expect(response.body.didDocument).toBeDefined();
      expect(response.body.accountId).toBe(account._id.toString());
      expect(response.body.status).toBeDefined();
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const nonExistentAccountId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/tenant/${nonExistentAccountId}/did`)
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
        .get(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      await testSuite.getRequest()
        .get(`/api/tenant/${account._id}/did`)
        .expect(401);
    });
  });

  describe('POST /api/tenant/:accountId/did', () => {
    it('should create tenant DID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const didData = {
        didMethod: 'did:web',
        domain: 'tenant.example.com',
        metadata: {
          createdBy: user._id.toString(),
          purpose: 'Tenant identity verification',
          version: '1.0'
        }
      };

      const response = await testSuite.getRequest()
        .post(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(didData)
        .expect(201);

      expect(response.body.did).toBeDefined();
      expect(response.body.didDocument).toBeDefined();
      expect(response.body.accountId).toBe(account._id.toString());
      expect(response.body.status).toBe('Active');
    });

    it('should validate DID method values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const didData = {
        didMethod: 'invalid-method', // Invalid DID method
        domain: 'tenant.example.com'
      };

      const response = await testSuite.getRequest()
        .post(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(didData)
        .expect(400);

      expect(response.body.message).toContain('didMethod must be one of the following values');
    });

    it('should validate domain format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const didData = {
        didMethod: 'did:web',
        domain: 'invalid-domain' // Invalid domain format
      };

      const response = await testSuite.getRequest()
        .post(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(didData)
        .expect(400);

      expect(response.body.message).toContain('domain must be a valid domain');
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const nonExistentAccountId = '507f1f77bcf86cd799439011';
      
      const didData = {
        didMethod: 'did:web',
        domain: 'tenant.example.com'
      };

      const response = await testSuite.getRequest()
        .post(`/api/tenant/${nonExistentAccountId}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(didData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const didData = {
        didMethod: 'did:web',
        domain: 'tenant.example.com'
      };

      const response = await testSuite.getRequest()
        .post(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(didData)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const didData = {
        didMethod: 'did:web',
        domain: 'tenant.example.com'
      };

      await testSuite.getRequest()
        .post(`/api/tenant/${account._id}/did`)
        .send(didData)
        .expect(401);
    });
  });

  describe('PUT /api/tenant/:accountId/did', () => {
    it('should update tenant DID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // Create DID first
      const didData = {
        didMethod: 'did:web',
        domain: 'tenant.example.com'
      };

      await testSuite.getRequest()
        .post(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(didData)
        .expect(201);

      // Update DID
      const updateData = {
        status: 'Updated',
        metadata: {
          lastUpdated: new Date().toISOString(),
          updatedBy: user._id.toString(),
          version: '2.0'
        }
      };

      const response = await testSuite.getRequest()
        .put(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe(updateData.status);
      expect(response.body.metadata).toEqual(updateData.metadata);
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const nonExistentAccountId = '507f1f77bcf86cd799439011';
      
      const updateData = {
        status: 'Updated'
      };

      const response = await testSuite.getRequest()
        .put(`/api/tenant/${nonExistentAccountId}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const updateData = {
        status: 'Updated'
      };

      const response = await testSuite.getRequest()
        .put(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const updateData = {
        status: 'Updated'
      };

      await testSuite.getRequest()
        .put(`/api/tenant/${account._id}/did`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/tenant/:accountId/did', () => {
    it('should delete tenant DID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // Create DID first
      const didData = {
        didMethod: 'did:web',
        domain: 'tenant.example.com'
      };

      await testSuite.getRequest()
        .post(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(didData)
        .expect(201);

      // Delete DID
      const response = await testSuite.getRequest()
        .delete(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const nonExistentAccountId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .delete(`/api/tenant/${nonExistentAccountId}/did`)
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
        .delete(`/api/tenant/${account._id}/did`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      await testSuite.getRequest()
        .delete(`/api/tenant/${account._id}/did`)
        .expect(401);
    });
  });
});
