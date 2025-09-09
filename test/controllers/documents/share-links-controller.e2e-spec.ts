import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';

describe('Share Links Controller (e2e)', () => {
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

  describe('POST /api/share-links/:accountId/:documentId', () => {
    it('should create share link successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // First create a trade document
      const documentData = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Test Document',
        documentType: 'Invoice',
        status: 'Published'
      });

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        accessLevel: 'view',
        description: 'Share link for external access',
        metadata: {
          sharedBy: user._id.toString(),
          purpose: 'External review'
        }
      };

      const response = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(201);

      expect(response.body.linkId).toBeDefined();
      expect(response.body.documentId).toBe(documentId);
      expect(response.body.accessLevel).toBe(shareLinkData.accessLevel);
      expect(response.body.expiresAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const documentId = '507f1f77bcf86cd799439011';

      const response = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('expiresAt should not be empty');
      expect(response.body.message).toContain('accessLevel should not be empty');
    });

    it('should validate access level values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const documentId = '507f1f77bcf86cd799439011';

      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'invalid-level' // Invalid access level
      };

      const response = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(400);

      expect(response.body.message).toContain('accessLevel must be one of the following values');
    });

    it('should validate expiration date', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const documentId = '507f1f77bcf86cd799439011';

      const shareLinkData = {
        expiresAt: 'invalid-date', // Invalid date format
        accessLevel: 'view'
      };

      const response = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(400);

      expect(response.body.message).toContain('expiresAt must be a valid ISO 8601 date');
    });

    it('should return 404 for non-existent document', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentDocumentId = '507f1f77bcf86cd799439011';

      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view'
      };

      const response = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${nonExistentDocumentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);
      const documentId = '507f1f77bcf86cd799439011';

      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view'
      };

      await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .send(shareLinkData)
        .expect(401);
    });
  });

  describe('GET /api/share-links/access/:linkId', () => {
    it('should get share link access successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a share link first
      const documentData = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Test Document',
        documentType: 'Invoice',
        status: 'Published'
      });

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view'
      };

      const shareResponse = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(201);

      const linkId = shareResponse.body.linkId;

      const response = await testSuite.getRequest()
        .get(`/api/share-links/access/${linkId}`)
        .expect(200);

      expect(response.body.linkId).toBe(linkId);
      expect(response.body.documentId).toBe(documentId);
      expect(response.body.accessLevel).toBe(shareLinkData.accessLevel);
    });

    it('should return 404 for non-existent link ID', async () => {
      const nonExistentLinkId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/share-links/access/${nonExistentLinkId}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should return 410 for expired link', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a share link with past expiration
      const documentData = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Test Document',
        documentType: 'Invoice',
        status: 'Published'
      });

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const shareLinkData = {
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        accessLevel: 'view'
      };

      const shareResponse = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(201);

      const linkId = shareResponse.body.linkId;

      const response = await testSuite.getRequest()
        .get(`/api/share-links/access/${linkId}`)
        .expect(410);

      expect(response.body.message).toContain('Share link has expired');
    });

    it('should not require authentication for public access', async () => {
      const linkId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/share-links/access/${linkId}`)
        .expect(404); // 404 because link doesn't exist, but no 401

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/share-links/access/:linkId/files/:variant', () => {
    it('should get document file through share link successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a share link first
      const documentData = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Test Document',
        documentType: 'Invoice',
        status: 'Published'
      });

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view'
      };

      const shareResponse = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(201);

      const linkId = shareResponse.body.linkId;

      const response = await testSuite.getRequest()
        .get(`/api/share-links/access/${linkId}/files/original`)
        .expect(200);

      expect(response.headers['content-type']).toBeDefined();
    });

    it('should return 404 for non-existent link ID file', async () => {
      const nonExistentLinkId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/share-links/access/${nonExistentLinkId}/files/original`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should validate file variant', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a share link first
      const documentData = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Test Document',
        documentType: 'Invoice',
        status: 'Published'
      });

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view'
      };

      const shareResponse = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(201);

      const linkId = shareResponse.body.linkId;

      const response = await testSuite.getRequest()
        .get(`/api/share-links/access/${linkId}/files/invalid-variant`)
        .expect(400);

      expect(response.body.message).toContain('Invalid file variant');
    });
  });

  describe('DELETE /api/share-links/:linkId', () => {
    it('should delete share link successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a share link first
      const documentData = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Test Document',
        documentType: 'Invoice',
        status: 'Published'
      });

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view'
      };

      const shareResponse = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(201);

      const linkId = shareResponse.body.linkId;

      const response = await testSuite.getRequest()
        .delete(`/api/share-links/${linkId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent link ID', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentLinkId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .delete(`/api/share-links/${nonExistentLinkId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const linkId = '507f1f77bcf86cd799439011';
      
      await testSuite.getRequest()
        .delete(`/api/share-links/${linkId}`)
        .expect(401);
    });
  });

  describe('GET /api/share-links/:documentId', () => {
    it('should get share links for document successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a share link first
      const documentData = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Test Document',
        documentType: 'Invoice',
        status: 'Published'
      });

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view'
      };

      await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(201);

      const response = await testSuite.getRequest()
        .get(`/api/share-links/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent document', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentDocumentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/share-links/${nonExistentDocumentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const documentId = '507f1f77bcf86cd799439011';
      
      await testSuite.getRequest()
        .get(`/api/share-links/${documentId}`)
        .expect(401);
    });
  });

  describe('GET /api/share-links/:linkId/details', () => {
    it('should get share link details successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a share link first
      const documentData = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Test Document',
        documentType: 'Invoice',
        status: 'Published'
      });

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view'
      };

      const shareResponse = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(201);

      const linkId = shareResponse.body.linkId;

      const response = await testSuite.getRequest()
        .get(`/api/share-links/${linkId}/details`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.linkId).toBe(linkId);
      expect(response.body.documentId).toBe(documentId);
      expect(response.body.accessLevel).toBe(shareLinkData.accessLevel);
      expect(response.body.expiresAt).toBeDefined();
    });

    it('should return 404 for non-existent link ID', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentLinkId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/share-links/${nonExistentLinkId}/details`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const linkId = '507f1f77bcf86cd799439011';
      
      await testSuite.getRequest()
        .get(`/api/share-links/${linkId}/details`)
        .expect(401);
    });
  });
});
