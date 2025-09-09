import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS, TEST_DEALS } from '../../fixtures/test-data';

describe('Trade Finance Controller (e2e)', () => {
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

  describe('GET /api/trade-finance/:accountId/trade-documents/available', () => {
    it('should get available trade documents successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create some trade documents
      const document1 = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Available Invoice 1',
        documentType: 'Invoice',
        status: 'Published'
      });

      const document2 = testSuite.testDataFactory.createTradeDocumentData({
        title: 'Available Invoice 2',
        documentType: 'Invoice',
        status: 'Published'
      });

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
        .get(`/api/trade-finance/${account._id}/trade-documents/available`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle pagination for available documents', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/trade-finance/${account._id}/trade-documents/available`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle search parameters for available documents', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/trade-finance/${account._id}/trade-documents/available`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ search: 'invoice', documentType: 'Invoice' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      await testSuite.getRequest()
        .get(`/api/trade-finance/${account._id}/trade-documents/available`)
        .expect(401);
    });
  });

  describe('POST /api/trade-finance/:accountId/deals', () => {
    it('should create deal successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      dealData.accountId = account._id.toString();

      const response = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(201);

      expect(response.body.dealName).toBe(dealData.dealName);
      expect(response.body.dealType).toBe(dealData.dealType);
      expect(response.body.amount).toBe(dealData.amount);
      expect(response.body.currency).toBe(dealData.currency);
      expect(response.body.status).toBe(dealData.status);
      expect(response.body.accountId).toBe(account._id.toString());
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('dealName should not be empty');
      expect(response.body.message).toContain('dealType should not be empty');
      expect(response.body.message).toContain('amount should not be empty');
    });

    it('should validate amount is positive', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const dealData = {
        dealName: 'Test Deal',
        dealType: 'Invoice Financing',
        amount: -1000, // Negative amount
        currency: 'USD',
        status: 'Pending'
      };

      const response = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(400);

      expect(response.body.message).toContain('amount must be a positive number');
    });

    it('should validate currency format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const dealData = {
        dealName: 'Test Deal',
        dealType: 'Invoice Financing',
        amount: 1000,
        currency: 'INVALID', // Invalid currency
        status: 'Pending'
      };

      const response = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(400);

      expect(response.body.message).toContain('currency must be a valid currency code');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);

      await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .send(dealData)
        .expect(401);
    });
  });

  describe('GET /api/trade-finance/:accountId/deals/:dealId', () => {
    it('should get deal by ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal first
      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      dealData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(201);

      const dealId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .get(`/api/trade-finance/${account._id}/deals/${dealId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.dealName).toBe(dealData.dealName);
      expect(response.body.dealType).toBe(dealData.dealType);
      expect(response.body.amount).toBe(dealData.amount);
    });

    it('should return 404 for non-existent deal', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentDealId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/trade-finance/${account._id}/deals/${nonExistentDealId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/trade-finance/:accountId/deals/:dealId', () => {
    it('should update deal successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal first
      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      dealData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(201);

      const dealId = createResponse.body._id;

      // Update the deal
      const updateData = {
        dealName: 'Updated Deal Name',
        amount: 75000,
        status: 'Approved',
        metadata: {
          approvalDate: new Date().toISOString(),
          approvedBy: user._id.toString()
        }
      };

      const response = await testSuite.getRequest()
        .put(`/api/trade-finance/${account._id}/deals/${dealId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.dealName).toBe(updateData.dealName);
      expect(response.body.amount).toBe(updateData.amount);
      expect(response.body.status).toBe(updateData.status);
    });

    it('should return 404 for non-existent deal', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentDealId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .put(`/api/trade-finance/${account._id}/deals/${nonExistentDealId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ dealName: 'Updated' })
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('DELETE /api/trade-finance/:accountId/deals/:dealId', () => {
    it('should delete deal successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal first
      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      dealData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(201);

      const dealId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .delete(`/api/trade-finance/${account._id}/deals/${dealId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent deal', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentDealId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .delete(`/api/trade-finance/${account._id}/deals/${nonExistentDealId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/trade-finance/:accountId/deals', () => {
    it('should get deals by account ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create multiple deals
      const deal1 = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      const deal2 = testSuite.testDataFactory.createDealData(TEST_DEALS.ASSET_BASED_LENDING);

      deal1.accountId = account._id.toString();
      deal2.accountId = account._id.toString();

      await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(deal1)
        .expect(201);

      await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(deal2)
        .expect(201);

      const response = await testSuite.getRequest()
        .get(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle pagination for deals', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle filtering by deal type', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ dealType: 'Invoice Financing' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should handle filtering by status', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ status: 'Pending' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/trade-finance/:accountId/deals/:dealId/actions', () => {
    it('should execute deal action successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal first
      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      dealData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(201);

      const dealId = createResponse.body._id;

      // Execute an action
      const actionData = {
        action: 'approve',
        executedBy: user._id.toString(),
        executedAt: new Date().toISOString(),
        metadata: {
          approvalNotes: 'Deal approved after review',
          riskAssessment: 'Low risk'
        }
      };

      const response = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals/${dealId}/actions`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(actionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.action).toBe(actionData.action);
      expect(response.body.executedBy).toBe(actionData.executedBy);
    });

    it('should validate required action fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal first
      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      dealData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(201);

      const dealId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals/${dealId}/actions`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('action should not be empty');
      expect(response.body.message).toContain('executedBy should not be empty');
    });

    it('should validate action values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal first
      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      dealData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(201);

      const dealId = createResponse.body._id;

      const actionData = {
        action: 'invalid-action', // Invalid action
        executedBy: user._id.toString(),
        executedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals/${dealId}/actions`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(actionData)
        .expect(400);

      expect(response.body.message).toContain('action must be one of the following values');
    });

    it('should return 404 for non-existent deal', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentDealId = '507f1f77bcf86cd799439011';
      
      const actionData = {
        action: 'approve',
        executedBy: user._id.toString(),
        executedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals/${nonExistentDealId}/actions`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(actionData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });
});
