import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';

describe('Audit Controller (e2e)', () => {
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

  describe('GET /api/audit/:subject/:resourceId', () => {
    it('should get audit events for resource successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const subject = 'user';
      const resourceId = user._id.toString();

      const response = await testSuite.getRequest()
        .get(`/api/audit/${subject}/${resourceId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle pagination for audit events', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const subject = 'user';
      const resourceId = user._id.toString();

      const response = await testSuite.getRequest()
        .get(`/api/audit/${subject}/${resourceId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle date range filtering', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const subject = 'user';
      const resourceId = user._id.toString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await testSuite.getRequest()
        .get(`/api/audit/${subject}/${resourceId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should handle action filtering', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const subject = 'user';
      const resourceId = user._id.toString();

      const response = await testSuite.getRequest()
        .get(`/api/audit/${subject}/${resourceId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ action: 'create' })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should validate subject parameter', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const subject = 'invalid-subject';
      const resourceId = user._id.toString();

      const response = await testSuite.getRequest()
        .get(`/api/audit/${subject}/${resourceId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(400);

      expect(response.body.message).toContain('subject must be one of the following values');
    });

    it('should validate resourceId format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const subject = 'user';
      const resourceId = 'invalid-id';

      const response = await testSuite.getRequest()
        .get(`/api/audit/${subject}/${resourceId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(400);

      expect(response.body.message).toContain('resourceId must be a valid ObjectId');
    });

    it('should return 404 for non-existent resource', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const subject = 'user';
      const nonExistentResourceId = '507f1f77bcf86cd799439011';

      const response = await testSuite.getRequest()
        .get(`/api/audit/${subject}/${nonExistentResourceId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const subject = 'user';
      const resourceId = user._id.toString();

      const response = await testSuite.getRequest()
        .get(`/api/audit/${subject}/${resourceId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const subject = 'user';
      const resourceId = '507f1f77bcf86cd799439011';

      await testSuite.getRequest()
        .get(`/api/audit/${subject}/${resourceId}`)
        .expect(401);
    });
  });
});
