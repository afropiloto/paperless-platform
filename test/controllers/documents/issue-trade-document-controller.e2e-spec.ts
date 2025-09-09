import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';

describe('Issue Trade Document Controller (e2e)', () => {
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

  describe('POST /api/issue-trade-document/:accountId/:documentId/issue', () => {
    it('should issue trade document successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // First create a trade document
      const documentData = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Test Invoice',
        documentType: 'Invoice',
        status: 'Draft'
      });

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      // Issue the document
      const issueData = {
        issuedBy: user._id.toString(),
        issuedAt: new Date().toISOString(),
        issueReason: 'Document ready for processing',
        metadata: {
          issueNumber: 'INV-001',
          issueDate: new Date().toISOString()
        }
      };

      const response = await testSuite.getRequest()
        .post(`/api/issue-trade-document/${account._id}/${documentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.documentId).toBe(documentId);
      expect(response.body.issuedBy).toBe(user._id.toString());
      expect(response.body.issuedAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const documentId = '507f1f77bcf86cd799439011';

      const response = await testSuite.getRequest()
        .post(`/api/issue-trade-document/${account._id}/${documentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('issuedBy should not be empty');
    });

    it('should validate issuedBy format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const documentId = '507f1f77bcf86cd799439011';

      const issueData = {
        issuedBy: 'invalid-user-id', // Invalid format
        issuedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/issue-trade-document/${account._id}/${documentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(400);

      expect(response.body.message).toContain('issuedBy must be a valid ObjectId');
    });

    it('should validate issuedAt format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const documentId = '507f1f77bcf86cd799439011';

      const issueData = {
        issuedBy: user._id.toString(),
        issuedAt: 'invalid-date' // Invalid date format
      };

      const response = await testSuite.getRequest()
        .post(`/api/issue-trade-document/${account._id}/${documentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(400);

      expect(response.body.message).toContain('issuedAt must be a valid ISO 8601 date');
    });

    it('should return 404 for non-existent document', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentDocumentId = '507f1f77bcf86cd799439011';

      const issueData = {
        issuedBy: user._id.toString(),
        issuedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/issue-trade-document/${account._id}/${nonExistentDocumentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentAccountId = '507f1f77bcf86cd799439011';
      const documentId = '507f1f77bcf86cd799439012';

      const issueData = {
        issuedBy: user._id.toString(),
        issuedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/issue-trade-document/${nonExistentAccountId}/${documentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);
      const documentId = '507f1f77bcf86cd799439011';

      const issueData = {
        issuedBy: '507f1f77bcf86cd799439012',
        issuedAt: new Date().toISOString()
      };

      await testSuite.getRequest()
        .post(`/api/issue-trade-document/${account._id}/${documentId}/issue`)
        .send(issueData)
        .expect(401);
    });

    it('should validate account ID format', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const invalidAccountId = 'invalid-account-id';
      const documentId = '507f1f77bcf86cd799439011';

      const issueData = {
        issuedBy: user._id.toString(),
        issuedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/issue-trade-document/${invalidAccountId}/${documentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(400);

      expect(response.body.message).toContain('Invalid account ID format');
    });

    it('should validate document ID format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const invalidDocumentId = 'invalid-document-id';

      const issueData = {
        issuedBy: user._id.toString(),
        issuedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/issue-trade-document/${account._id}/${invalidDocumentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(400);

      expect(response.body.message).toContain('Invalid document ID format');
    });

    it('should handle document already issued', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create and issue a document
      const documentData = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Test Invoice',
        documentType: 'Invoice',
        status: 'Draft'
      });

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const issueData = {
        issuedBy: user._id.toString(),
        issuedAt: new Date().toISOString()
      };

      // Issue the document first time
      await testSuite.getRequest()
        .post(`/api/issue-trade-document/${account._id}/${documentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(200);

      // Try to issue again
      const response = await testSuite.getRequest()
        .post(`/api/issue-trade-document/${account._id}/${documentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(409);

      expect(response.body.message).toContain('Document has already been issued');
    });
  });
});
