import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS, TEST_ONBOARDING } from '../../fixtures/test-data';

describe('Onboarding Controller (e2e)', () => {
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

  describe('POST /api/onboarding', () => {
    it('should create onboarding processing record successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const onboardingData = testSuite.testDataFactory.createOnboardingData(TEST_ONBOARDING.BASIC);
      onboardingData.accountId = account._id.toString();

      const response = await testSuite.getRequest()
        .post('/api/onboarding')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(onboardingData)
        .expect(201);

      expect(response.body.customerName).toBe(onboardingData.customerName);
      expect(response.body.customerEmail).toBe(onboardingData.customerEmail);
      expect(response.body.status).toBe(onboardingData.status);
      expect(response.body.accountId).toBe(account._id.toString());
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .post('/api/onboarding')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('customerName should not be empty');
      expect(response.body.message).toContain('customerEmail should not be empty');
    });

    it('should validate email format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const onboardingData = {
        customerName: 'Test Customer',
        customerEmail: 'invalid-email', // Invalid email format
        status: 'Pending'
      };

      const response = await testSuite.getRequest()
        .post('/api/onboarding')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(onboardingData)
        .expect(400);

      expect(response.body.message).toContain('customerEmail must be an email');
    });

    it('should validate status values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const onboardingData = {
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        status: 'InvalidStatus' // Invalid status
      };

      const response = await testSuite.getRequest()
        .post('/api/onboarding')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(onboardingData)
        .expect(400);

      expect(response.body.message).toContain('status must be one of the following values');
    });

    it('should require authentication', async () => {
      const onboardingData = testSuite.testDataFactory.createOnboardingData(TEST_ONBOARDING.BASIC);

      await testSuite.getRequest()
        .post('/api/onboarding')
        .send(onboardingData)
        .expect(401);
    });
  });

  describe('GET /api/onboarding/analytics', () => {
    it('should get onboarding processing analytics successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/onboarding/analytics')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.totalOnboardings).toBeDefined();
      expect(response.body.pendingOnboardings).toBeDefined();
      expect(response.body.completedOnboardings).toBeDefined();
      expect(response.body.rejectedOnboardings).toBeDefined();
    });

    it('should handle date range filtering', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await testSuite.getRequest()
        .get('/api/onboarding/analytics')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should require authentication', async () => {
      await testSuite.getRequest()
        .get('/api/onboarding/analytics')
        .expect(401);
    });
  });

  describe('GET /api/onboarding', () => {
    it('should get onboarding processing records successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/onboarding')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle pagination for onboarding records', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/onboarding')
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

      const response = await testSuite.getRequest()
        .get('/api/onboarding')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ search: 'test', status: 'Pending' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should handle sorting parameters', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/onboarding')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should require authentication', async () => {
      await testSuite.getRequest()
        .get('/api/onboarding')
        .expect(401);
    });
  });

  describe('GET /api/onboarding/:id', () => {
    it('should get onboarding processing by ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create an onboarding record first
      const onboardingData = testSuite.testDataFactory.createOnboardingData(TEST_ONBOARDING.BASIC);
      onboardingData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post('/api/onboarding')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(onboardingData)
        .expect(201);

      const onboardingId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .get(`/api/onboarding/${onboardingId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.customerName).toBe(onboardingData.customerName);
      expect(response.body.customerEmail).toBe(onboardingData.customerEmail);
      expect(response.body.status).toBe(onboardingData.status);
    });

    it('should return 404 for non-existent onboarding record', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/onboarding/${nonExistentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/onboarding/:id/decision', () => {
    it('should update decision for onboarding successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create an onboarding record first
      const onboardingData = testSuite.testDataFactory.createOnboardingData(TEST_ONBOARDING.BASIC);
      onboardingData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post('/api/onboarding')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(onboardingData)
        .expect(201);

      const onboardingId = createResponse.body._id;

      // Update decision
      const decisionData = {
        decision: 'Approved',
        decisionBy: user._id.toString(),
        decisionAt: new Date().toISOString(),
        decisionNotes: 'Customer meets all requirements',
        nextSteps: 'Proceed with account setup',
        metadata: {
          riskLevel: 'Low',
          complianceCheck: 'Passed'
        }
      };

      const response = await testSuite.getRequest()
        .post(`/api/onboarding/${onboardingId}/decision`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(decisionData)
        .expect(200);

      expect(response.body.decision).toBe(decisionData.decision);
      expect(response.body.decisionBy).toBe(decisionData.decisionBy);
      expect(response.body.decisionNotes).toBe(decisionData.decisionNotes);
    });

    it('should validate decision values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create an onboarding record first
      const onboardingData = testSuite.testDataFactory.createOnboardingData(TEST_ONBOARDING.BASIC);
      onboardingData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post('/api/onboarding')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(onboardingData)
        .expect(201);

      const onboardingId = createResponse.body._id;

      const decisionData = {
        decision: 'InvalidDecision', // Invalid decision
        decisionBy: user._id.toString(),
        decisionAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/onboarding/${onboardingId}/decision`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(decisionData)
        .expect(400);

      expect(response.body.message).toContain('decision must be one of the following values');
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create an onboarding record first
      const onboardingData = testSuite.testDataFactory.createOnboardingData(TEST_ONBOARDING.BASIC);
      onboardingData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post('/api/onboarding')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(onboardingData)
        .expect(201);

      const onboardingId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .post(`/api/onboarding/${onboardingId}/decision`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('decision should not be empty');
      expect(response.body.message).toContain('decisionBy should not be empty');
    });

    it('should return 404 for non-existent onboarding record', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const decisionData = {
        decision: 'Approved',
        decisionBy: user._id.toString(),
        decisionAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/onboarding/${nonExistentId}/decision`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(decisionData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const onboardingId = '507f1f77bcf86cd799439011';
      
      const decisionData = {
        decision: 'Approved',
        decisionBy: '507f1f77bcf86cd799439012',
        decisionAt: new Date().toISOString()
      };

      await testSuite.getRequest()
        .post(`/api/onboarding/${onboardingId}/decision`)
        .send(decisionData)
        .expect(401);
    });
  });
});
