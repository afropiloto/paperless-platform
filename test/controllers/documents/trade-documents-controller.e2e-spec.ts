import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS, TEST_TRADE_DOCUMENTS, TEST_FILES } from '../../fixtures/test-data';

describe('Trade Documents Controller (e2e)', () => {
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

  describe('GET /api/trade-documents/:accountId/:documentId/file/:fileVariant', () => {
    it('should get document file successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // First create a document
      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      // Get document file
      const response = await testSuite.getRequest()
        .get(`/api/trade-documents/${account._id}/${documentId}/file/original`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBeDefined();
    });

    it('should return 404 for non-existent document', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/trade-documents/${account._id}/${nonExistentId}/file/original`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);
      const documentId = '507f1f77bcf86cd799439011';

      await testSuite.getRequest()
        .get(`/api/trade-documents/${account._id}/${documentId}/file/original`)
        .expect(401);
    });
  });

  describe('PUT /api/trade-documents/:accountId/:documentId/file', () => {
    it('should update document file successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // First create a document
      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      // Update document file
      const fileData = TEST_FILES.PDF;
      const response = await testSuite.apiHelper.uploadFile(
        `/api/trade-documents/${account._id}/${documentId}/file`,
        fileData,
        token.accessToken
      ).expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should validate file type', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      // Try to upload invalid file type
      const invalidFile = TEST_FILES.TEXT;
      const response = await testSuite.apiHelper.uploadFile(
        `/api/trade-documents/${account._id}/${documentId}/file`,
        invalidFile,
        token.accessToken
      ).expect(400);

      expect(response.body.message).toContain('Invalid file type');
    });
  });

  describe('POST /api/trade-documents/:accountId/file', () => {
    it('should upload new document file successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const fileData = TEST_FILES.PDF;
      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);

      const response = await testSuite.apiHelper.uploadFile(
        `/api/trade-documents/${account._id}/file`,
        fileData,
        token.accessToken,
        documentData
      ).expect(201);

      expect(response.body.title).toBe(documentData.title);
      expect(response.body.documentType).toBe(documentData.documentType);
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const fileData = TEST_FILES.PDF;

      const response = await testSuite.apiHelper.uploadFile(
        `/api/trade-documents/${account._id}/file`,
        fileData,
        token.accessToken,
        {} // Missing required fields
      ).expect(400);

      expect(response.body.message).toContain('title should not be empty');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const fileData = TEST_FILES.PDF;
      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);

      await testSuite.apiHelper.uploadFile(
        `/api/trade-documents/${account._id}/file`,
        fileData,
        undefined, // No authentication
        documentData
      ).expect(401);
    });
  });

  describe('GET /api/trade-documents/:accountId/:documentId', () => {
    it('should get document by ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .get(`/api/trade-documents/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.title).toBe(documentData.title);
      expect(response.body.documentType).toBe(documentData.documentType);
      expect(response.body.status).toBe(documentData.status);
    });

    it('should return 404 for non-existent document', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/trade-documents/${account._id}/${nonExistentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/trade-documents/:accountId/', () => {
    it('should get documents by account ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create multiple documents
      const document1 = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      const document2 = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.CONTRACT);

      await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(document1)
        .expect(201);

      await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(document2)
        .expect(201);

      const response = await testSuite.getRequest()
        .get(`/api/trade-documents/${account._id}/`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle pagination', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/trade-documents/${account._id}/`)
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
        TEST_USERS.BASIC
      );

      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const response = await testSuite.getRequest()
        .get(`/api/trade-documents/${account._id}/`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ search: documentData.title })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DELETE /api/trade-documents/:accountId/:documentId', () => {
    it('should delete document successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .delete(`/api/trade-documents/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent document', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .delete(`/api/trade-documents/${account._id}/${nonExistentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PATCH /api/trade-documents/:accountId/:documentId', () => {
    it('should update document successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      const updateData = {
        title: 'Updated Document Title',
        status: 'Published',
        metadata: {
          amount: 2000,
          currency: 'EUR'
        }
      };

      const response = await testSuite.getRequest()
        .patch(`/api/trade-documents/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.metadata.amount).toBe(updateData.metadata.amount);
    });

    it('should return 404 for non-existent document', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .patch(`/api/trade-documents/${account._id}/${nonExistentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/trade-documents/:accountId', () => {
    it('should create document successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);

      const response = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      expect(response.body.title).toBe(documentData.title);
      expect(response.body.documentType).toBe(documentData.documentType);
      expect(response.body.status).toBe(documentData.status);
      expect(response.body.accountId).toBe(account._id.toString());
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('title should not be empty');
      expect(response.body.message).toContain('documentType should not be empty');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);

      await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .send(documentData)
        .expect(401);
    });
  });
});
