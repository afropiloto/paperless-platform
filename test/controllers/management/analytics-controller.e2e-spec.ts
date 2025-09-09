import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';

describe('Analytics Controller (e2e)', () => {
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

  describe('GET /api/analytics/:accountId/trade-documents/recent', () => {
    it('should get recent trade documents analytics successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/recent`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle date range filtering', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/recent`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should handle limit parameter', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/recent`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ limit: 5 })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/recent`)
        .expect(401);
    });
  });

  describe('GET /api/analytics/:accountId/trade-finance/recent', () => {
    it('should get recent trade finance analytics successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-finance/recent`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle filtering by deal type', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-finance/recent`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ dealType: 'Invoice Financing' })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should handle filtering by status', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-finance/recent`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ status: 'Approved' })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-finance/recent`)
        .expect(401);
    });
  });

  describe('GET /api/analytics/:accountId/trade-documents/summary', () => {
    it('should get trade documents summary successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/summary`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.totalDocuments).toBeDefined();
      expect(response.body.documentsByType).toBeDefined();
      expect(response.body.documentsByStatus).toBeDefined();
      expect(response.body.documentsByMonth).toBeDefined();
    });

    it('should handle date range filtering for summary', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/summary`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/summary`)
        .expect(401);
    });
  });

  describe('GET /api/analytics/:accountId/trade-finance/summary', () => {
    it('should get trade finance summary successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-finance/summary`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.totalDeals).toBeDefined();
      expect(response.body.dealsByType).toBeDefined();
      expect(response.body.dealsByStatus).toBeDefined();
      expect(response.body.totalVolume).toBeDefined();
      expect(response.body.volumeByMonth).toBeDefined();
    });

    it('should handle currency filtering for summary', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-finance/summary`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ currency: 'USD' })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-finance/summary`)
        .expect(401);
    });
  });

  describe('GET /api/analytics/:accountId/trade-documents/summary/debug', () => {
    it('should get debug trade documents summary successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN // Admin user for debug endpoint
      );

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/summary/debug`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.debug).toBeDefined();
      expect(response.body.rawData).toBeDefined();
      expect(response.body.aggregations).toBeDefined();
    });

    it('should require admin permissions for debug endpoint', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const response = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/summary/debug`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/summary/debug`)
        .expect(401);
    });
  });
});
