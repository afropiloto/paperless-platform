import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';

describe('Verify Trade Document Controller (e2e)', () => {
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

  describe('GET /api/verify-trade-document/:trackingId', () => {
    it('should get document verification by tracking ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a document verification
      const verificationData = {
        trackingId: 'TRK-123456789',
        documentId: '507f1f77bcf86cd799439011',
        status: 'Verified',
        verifiedAt: new Date().toISOString(),
        accountId: account._id.toString()
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/verify-trade-document')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(verificationData)
        .expect(201);

      const trackingId = createResponse.body.trackingId;

      const response = await testSuite.getRequest()
        .get(`/api/verify-trade-document/${trackingId}`)
        .expect(200);

      expect(response.body.trackingId).toBe(trackingId);
      expect(response.body.status).toBe(verificationData.status);
      expect(response.body.verifiedAt).toBeDefined();
    });

    it('should return 404 for non-existent tracking ID', async () => {
      const nonExistentTrackingId = 'TRK-NONEXISTENT';
      
      const response = await testSuite.getRequest()
        .get(`/api/verify-trade-document/${nonExistentTrackingId}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should not require authentication for public verification', async () => {
      // This endpoint should be publicly accessible for document verification
      const trackingId = 'TRK-PUBLIC-123';
      
      const response = await testSuite.getRequest()
        .get(`/api/verify-trade-document/${trackingId}`)
        .expect(404); // 404 because tracking ID doesn't exist, but no 401

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/verify-trade-document/:trackingId/file', () => {
    it('should get document file for verification successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a document verification with file
      const verificationData = {
        trackingId: 'TRK-FILE-123456789',
        documentId: '507f1f77bcf86cd799439011',
        status: 'Verified',
        verifiedAt: new Date().toISOString(),
        accountId: account._id.toString(),
        fileUrl: 'https://example.com/document.pdf'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/verify-trade-document')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(verificationData)
        .expect(201);

      const trackingId = createResponse.body.trackingId;

      const response = await testSuite.getRequest()
        .get(`/api/verify-trade-document/${trackingId}/file`)
        .expect(200);

      expect(response.headers['content-type']).toBeDefined();
    });

    it('should return 404 for non-existent tracking ID file', async () => {
      const nonExistentTrackingId = 'TRK-NONEXISTENT';
      
      const response = await testSuite.getRequest()
        .get(`/api/verify-trade-document/${nonExistentTrackingId}/file`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should not require authentication for public file access', async () => {
      const trackingId = 'TRK-PUBLIC-FILE-123';
      
      const response = await testSuite.getRequest()
        .get(`/api/verify-trade-document/${trackingId}/file`)
        .expect(404); // 404 because tracking ID doesn't exist, but no 401

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/verify-trade-document', () => {
    it('should create document verification successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const verificationData = {
        trackingId: 'TRK-123456789',
        documentId: '507f1f77bcf86cd799439011',
        status: 'Pending',
        accountId: account._id.toString(),
        documentHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      };

      const response = await testSuite.getRequest()
        .post('/api/verify-trade-document')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(verificationData)
        .expect(201);

      expect(response.body.trackingId).toBe(verificationData.trackingId);
      expect(response.body.documentId).toBe(verificationData.documentId);
      expect(response.body.status).toBe(verificationData.status);
      expect(response.body.accountId).toBe(account._id.toString());
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .post('/api/verify-trade-document')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('trackingId should not be empty');
      expect(response.body.message).toContain('documentId should not be empty');
    });

    it('should validate tracking ID format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const verificationData = {
        trackingId: 'invalid-tracking-id', // Invalid format
        documentId: '507f1f77bcf86cd799439011',
        status: 'Pending',
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/verify-trade-document')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(verificationData)
        .expect(400);

      expect(response.body.message).toContain('trackingId must match pattern');
    });

    it('should validate document hash format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const verificationData = {
        trackingId: 'TRK-123456789',
        documentId: '507f1f77bcf86cd799439011',
        status: 'Pending',
        accountId: account._id.toString(),
        documentHash: 'invalid-hash' // Invalid hash format
      };

      const response = await testSuite.getRequest()
        .post('/api/verify-trade-document')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(verificationData)
        .expect(400);

      expect(response.body.message).toContain('documentHash must be a valid hash');
    });

    it('should validate status values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const verificationData = {
        trackingId: 'TRK-123456789',
        documentId: '507f1f77bcf86cd799439011',
        status: 'InvalidStatus', // Invalid status
        accountId: account._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/verify-trade-document')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(verificationData)
        .expect(400);

      expect(response.body.message).toContain('status must be one of the following values');
    });

    it('should require authentication', async () => {
      const verificationData = {
        trackingId: 'TRK-123456789',
        documentId: '507f1f77bcf86cd799439011',
        status: 'Pending'
      };

      await testSuite.getRequest()
        .post('/api/verify-trade-document')
        .send(verificationData)
        .expect(401);
    });

    it('should handle duplicate tracking ID', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const verificationData = {
        trackingId: 'TRK-DUPLICATE-123',
        documentId: '507f1f77bcf86cd799439011',
        status: 'Pending',
        accountId: account._id.toString()
      };

      // Create first verification
      await testSuite.getRequest()
        .post('/api/verify-trade-document')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(verificationData)
        .expect(201);

      // Try to create duplicate
      const response = await testSuite.getRequest()
        .post('/api/verify-trade-document')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(verificationData)
        .expect(409);

      expect(response.body.message).toContain('Tracking ID already exists');
    });
  });
});
