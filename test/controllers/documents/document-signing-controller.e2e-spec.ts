import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';

describe('Document Signing Controller (e2e)', () => {
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

  describe('GET /api/document-signing/:id', () => {
    it('should get document signing by ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a document signing request
      const signingData = {
        documentId: '507f1f77bcf86cd799439011',
        signers: [user.walletAddress],
        expirationDays: 30,
        status: 'Pending'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/document-signing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(signingData)
        .expect(201);

      const signingId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .get(`/api/document-signing/${signingId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.documentId).toBe(signingData.documentId);
      expect(response.body.signers).toEqual(signingData.signers);
      expect(response.body.status).toBe(signingData.status);
    });

    it('should return 404 for non-existent document signing', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/document-signing/${nonExistentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/document-signing/trade-document/:id', () => {
    it('should get document signing by trade document ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const tradeDocumentId = '507f1f77bcf86cd799439011';

      const response = await testSuite.getRequest()
        .get(`/api/document-signing/trade-document/${tradeDocumentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /api/document-signing/wallet/:walletAddress', () => {
    it('should get document signings by wallet address successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.WALLET_USER
      );

      const response = await testSuite.getRequest()
        .get(`/api/document-signing/wallet/${user.walletAddress}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle pagination for wallet signings', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.WALLET_USER
      );

      const response = await testSuite.getRequest()
        .get(`/api/document-signing/wallet/${user.walletAddress}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/document-signing/account/:accountId', () => {
    it('should get document signings by account ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/document-signing/account/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle search parameters for account signings', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/document-signing/account/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ search: 'test', status: 'Pending' })
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('PUT /api/document-signing/:id/status', () => {
    it('should update document signing status successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a document signing request
      const signingData = {
        documentId: '507f1f77bcf86cd799439011',
        signers: [user.walletAddress],
        expirationDays: 30,
        status: 'Pending'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/document-signing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(signingData)
        .expect(201);

      const signingId = createResponse.body._id;

      // Update status
      const updateData = {
        status: 'Completed',
        completedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .put(`/api/document-signing/${signingId}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe(updateData.status);
      expect(response.body.completedAt).toBeDefined();
    });

    it('should validate status values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const signingData = {
        documentId: '507f1f77bcf86cd799439011',
        signers: [user.walletAddress],
        expirationDays: 30,
        status: 'Pending'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/document-signing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(signingData)
        .expect(201);

      const signingId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .put(`/api/document-signing/${signingId}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ status: 'InvalidStatus' })
        .expect(400);

      expect(response.body.message).toContain('status must be one of the following values');
    });

    it('should return 404 for non-existent document signing', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .put(`/api/document-signing/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ status: 'Completed' })
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/document-signing', () => {
    it('should create document signing request successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const signingData = {
        documentId: '507f1f77bcf86cd799439011',
        signers: [user.walletAddress],
        expirationDays: 30,
        status: 'Pending',
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/document-signing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(signingData)
        .expect(201);

      expect(response.body.documentId).toBe(signingData.documentId);
      expect(response.body.signers).toEqual(signingData.signers);
      expect(response.body.expirationDays).toBe(signingData.expirationDays);
      expect(response.body.status).toBe(signingData.status);
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .post('/api/document-signing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('documentId should not be empty');
      expect(response.body.message).toContain('signers should not be empty');
    });

    it('should validate signers array', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const signingData = {
        documentId: '507f1f77bcf86cd799439011',
        signers: [], // Empty array
        expirationDays: 30,
        status: 'Pending',
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/document-signing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(signingData)
        .expect(400);

      expect(response.body.message).toContain('signers should not be empty');
    });

    it('should validate expiration days', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const signingData = {
        documentId: '507f1f77bcf86cd799439011',
        signers: [user.walletAddress],
        expirationDays: -1, // Invalid negative value
        status: 'Pending',
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/document-signing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(signingData)
        .expect(400);

      expect(response.body.message).toContain('expirationDays must be a positive number');
    });

    it('should require authentication', async () => {
      const signingData = {
        documentId: '507f1f77bcf86cd799439011',
        signers: ['0x1234567890123456789012345678901234567890'],
        expirationDays: 30,
        status: 'Pending'
      };

      await testSuite.getRequest()
        .post('/api/document-signing')
        .send(signingData)
        .expect(401);
    });
  });
});
