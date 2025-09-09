import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';

describe('Deal Processing Controller (e2e)', () => {
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

  describe('GET /api/deal-processing/analytics', () => {
    it('should get deal processing analytics successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/deal-processing/analytics')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.totalDeals).toBeDefined();
      expect(response.body.pendingDeals).toBeDefined();
      expect(response.body.approvedDeals).toBeDefined();
      expect(response.body.rejectedDeals).toBeDefined();
    });

    it('should handle date range filtering', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await testSuite.getRequest()
        .get('/api/deal-processing/analytics')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should require authentication', async () => {
      await testSuite.getRequest()
        .get('/api/deal-processing/analytics')
        .expect(401);
    });
  });

  describe('GET /api/deal-processing', () => {
    it('should get deal processing records successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle pagination for deal processing records', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/deal-processing')
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
        .get('/api/deal-processing')
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
        .get('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/deal-processing/:id', () => {
    it('should get deal processing by ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal processing record first
      const processingData = {
        dealId: '507f1f77bcf86cd799439011',
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: 50000,
        currency: 'USD',
        description: 'Test deal processing'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(processingData)
        .expect(201);

      const processingId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .get(`/api/deal-processing/${processingId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.dealId).toBe(processingData.dealId);
      expect(response.body.status).toBe(processingData.status);
      expect(response.body.processingType).toBe(processingData.processingType);
    });

    it('should return 404 for non-existent deal processing', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/deal-processing/${nonExistentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/deal-processing', () => {
    it('should create deal processing record successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const processingData = {
        dealId: '507f1f77bcf86cd799439011',
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: 50000,
        currency: 'USD',
        description: 'Test deal processing',
        metadata: {
          riskLevel: 'Medium',
          priority: 'High'
        }
      };

      const response = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(processingData)
        .expect(201);

      expect(response.body.dealId).toBe(processingData.dealId);
      expect(response.body.status).toBe(processingData.status);
      expect(response.body.processingType).toBe(processingData.processingType);
      expect(response.body.amount).toBe(processingData.amount);
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('dealId should not be empty');
      expect(response.body.message).toContain('accountId should not be empty');
      expect(response.body.message).toContain('status should not be empty');
    });

    it('should validate amount is positive', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const processingData = {
        dealId: '507f1f77bcf86cd799439011',
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: -1000, // Negative amount
        currency: 'USD'
      };

      const response = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(processingData)
        .expect(400);

      expect(response.body.message).toContain('amount must be a positive number');
    });

    it('should require authentication', async () => {
      const processingData = {
        dealId: '507f1f77bcf86cd799439011',
        accountId: '507f1f77bcf86cd799439012',
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: 50000,
        currency: 'USD'
      };

      await testSuite.getRequest()
        .post('/api/deal-processing')
        .send(processingData)
        .expect(401);
    });
  });

  describe('POST /api/deal-processing/:id/funding-decision', () => {
    it('should update funding decision successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal processing record first
      const processingData = {
        dealId: '507f1f77bcf86cd799439011',
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: 50000,
        currency: 'USD'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(processingData)
        .expect(201);

      const processingId = createResponse.body._id;

      // Update funding decision
      const decisionData = {
        decision: 'Approved',
        decisionBy: user._id.toString(),
        decisionAt: new Date().toISOString(),
        decisionNotes: 'Deal approved after thorough review',
        fundingAmount: 45000,
        fundingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/deal-processing/${processingId}/funding-decision`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(decisionData)
        .expect(200);

      expect(response.body.decision).toBe(decisionData.decision);
      expect(response.body.decisionBy).toBe(decisionData.decisionBy);
      expect(response.body.fundingAmount).toBe(decisionData.fundingAmount);
    });

    it('should validate decision values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal processing record first
      const processingData = {
        dealId: '507f1f77bcf86cd799439011',
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: 50000,
        currency: 'USD'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(processingData)
        .expect(201);

      const processingId = createResponse.body._id;

      const decisionData = {
        decision: 'InvalidDecision', // Invalid decision
        decisionBy: user._id.toString(),
        decisionAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/deal-processing/${processingId}/funding-decision`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(decisionData)
        .expect(400);

      expect(response.body.message).toContain('decision must be one of the following values');
    });

    it('should return 404 for non-existent deal processing', async () => {
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
        .post(`/api/deal-processing/${nonExistentId}/funding-decision`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(decisionData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/deal-processing/:dealId/promissory-note', () => {
    it('should create promissory note successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const dealId = '507f1f77bcf86cd799439011';

      const promissoryNoteData = {
        noteNumber: 'PN-001',
        principalAmount: 50000,
        interestRate: 5.5,
        maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        borrowerInfo: {
          name: 'Test Borrower',
          address: '123 Test Street',
          city: 'Test City',
          country: 'Test Country'
        },
        lenderInfo: {
          name: 'Test Lender',
          address: '456 Lender Avenue',
          city: 'Lender City',
          country: 'Lender Country'
        }
      };

      const response = await testSuite.getRequest()
        .post(`/api/deal-processing/${dealId}/promissory-note`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(promissoryNoteData)
        .expect(201);

      expect(response.body.noteNumber).toBe(promissoryNoteData.noteNumber);
      expect(response.body.principalAmount).toBe(promissoryNoteData.principalAmount);
      expect(response.body.interestRate).toBe(promissoryNoteData.interestRate);
    });

    it('should validate required fields for promissory note', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const dealId = '507f1f77bcf86cd799439011';

      const response = await testSuite.getRequest()
        .post(`/api/deal-processing/${dealId}/promissory-note`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('noteNumber should not be empty');
      expect(response.body.message).toContain('principalAmount should not be empty');
      expect(response.body.message).toContain('interestRate should not be empty');
    });

    it('should validate interest rate range', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const dealId = '507f1f77bcf86cd799439011';

      const promissoryNoteData = {
        noteNumber: 'PN-001',
        principalAmount: 50000,
        interestRate: 150, // Invalid interest rate (too high)
        maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await testSuite.getRequest()
        .post(`/api/deal-processing/${dealId}/promissory-note`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(promissoryNoteData)
        .expect(400);

      expect(response.body.message).toContain('interestRate must be between 0 and 100');
    });
  });

  describe('PATCH /api/deal-processing/:id/promissory-note/issue', () => {
    it('should issue promissory note successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal processing record with promissory note first
      const processingData = {
        dealId: '507f1f77bcf86cd799439011',
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: 50000,
        currency: 'USD'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(processingData)
        .expect(201);

      const processingId = createResponse.body._id;

      // Create promissory note
      const promissoryNoteData = {
        noteNumber: 'PN-001',
        principalAmount: 50000,
        interestRate: 5.5,
        maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      };

      await testSuite.getRequest()
        .post(`/api/deal-processing/${processingData.dealId}/promissory-note`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(promissoryNoteData)
        .expect(201);

      // Issue the promissory note
      const issueData = {
        issuedBy: user._id.toString(),
        issuedAt: new Date().toISOString(),
        issueNotes: 'Promissory note issued after approval'
      };

      const response = await testSuite.getRequest()
        .patch(`/api/deal-processing/${processingId}/promissory-note/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.issuedBy).toBe(issueData.issuedBy);
      expect(response.body.issuedAt).toBeDefined();
    });

    it('should return 404 for non-existent deal processing', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const issueData = {
        issuedBy: user._id.toString(),
        issuedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .patch(`/api/deal-processing/${nonExistentId}/promissory-note/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PATCH /api/deal-processing/:id/promissory-note', () => {
    it('should update promissory note successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal processing record with promissory note first
      const processingData = {
        dealId: '507f1f77bcf86cd799439011',
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: 50000,
        currency: 'USD'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(processingData)
        .expect(201);

      const processingId = createResponse.body._id;

      // Create promissory note
      const promissoryNoteData = {
        noteNumber: 'PN-001',
        principalAmount: 50000,
        interestRate: 5.5,
        maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      };

      await testSuite.getRequest()
        .post(`/api/deal-processing/${processingData.dealId}/promissory-note`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(promissoryNoteData)
        .expect(201);

      // Update the promissory note
      const updateData = {
        principalAmount: 45000,
        interestRate: 6.0,
        maturityDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: user._id.toString(),
        updateNotes: 'Terms updated after negotiation'
      };

      const response = await testSuite.getRequest()
        .patch(`/api/deal-processing/${processingId}/promissory-note`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.principalAmount).toBe(updateData.principalAmount);
      expect(response.body.interestRate).toBe(updateData.interestRate);
    });
  });

  describe('PATCH /api/deal-processing/:id/promissory-note/sign', () => {
    it('should sign promissory note successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal processing record with promissory note first
      const processingData = {
        dealId: '507f1f77bcf86cd799439011',
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: 50000,
        currency: 'USD'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(processingData)
        .expect(201);

      const processingId = createResponse.body._id;

      // Create and issue promissory note
      const promissoryNoteData = {
        noteNumber: 'PN-001',
        principalAmount: 50000,
        interestRate: 5.5,
        maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      };

      await testSuite.getRequest()
        .post(`/api/deal-processing/${processingData.dealId}/promissory-note`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(promissoryNoteData)
        .expect(201);

      await testSuite.getRequest()
        .patch(`/api/deal-processing/${processingId}/promissory-note/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          issuedBy: user._id.toString(),
          issuedAt: new Date().toISOString()
        })
        .expect(200);

      // Sign the promissory note
      const signData = {
        signedBy: user._id.toString(),
        signedAt: new Date().toISOString(),
        signature: 'digital-signature-hash',
        signerRole: 'Borrower'
      };

      const response = await testSuite.getRequest()
        .patch(`/api/deal-processing/${processingId}/promissory-note/sign`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(signData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.signedBy).toBe(signData.signedBy);
      expect(response.body.signedAt).toBeDefined();
    });
  });

  describe('GET /api/deal-processing/:id/promissory-note/download', () => {
    it('should download promissory note PDF successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal processing record with promissory note first
      const processingData = {
        dealId: '507f1f77bcf86cd799439011',
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: 50000,
        currency: 'USD'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(processingData)
        .expect(201);

      const processingId = createResponse.body._id;

      // Create, issue, and sign promissory note
      const promissoryNoteData = {
        noteNumber: 'PN-001',
        principalAmount: 50000,
        interestRate: 5.5,
        maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      };

      await testSuite.getRequest()
        .post(`/api/deal-processing/${processingData.dealId}/promissory-note`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(promissoryNoteData)
        .expect(201);

      await testSuite.getRequest()
        .patch(`/api/deal-processing/${processingId}/promissory-note/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          issuedBy: user._id.toString(),
          issuedAt: new Date().toISOString()
        })
        .expect(200);

      await testSuite.getRequest()
        .patch(`/api/deal-processing/${processingId}/promissory-note/sign`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          signedBy: user._id.toString(),
          signedAt: new Date().toISOString(),
          signature: 'digital-signature-hash',
          signerRole: 'Borrower'
        })
        .expect(200);

      // Download the promissory note
      const response = await testSuite.getRequest()
        .get(`/api/deal-processing/${processingId}/promissory-note/download`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
    });

    it('should return 404 for non-existent deal processing', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/deal-processing/${nonExistentId}/promissory-note/download`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PATCH /api/deal-processing/:id/checklist', () => {
    it('should update due diligence checklist successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a deal processing record first
      const processingData = {
        dealId: '507f1f77bcf86cd799439011',
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: 50000,
        currency: 'USD'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(processingData)
        .expect(201);

      const processingId = createResponse.body._id;

      // Update checklist
      const checklistData = {
        checklistType: 'KYC',
        items: [
          { id: '1', description: 'Identity verification', completed: true, completedBy: user._id.toString() },
          { id: '2', description: 'Address verification', completed: true, completedBy: user._id.toString() },
          { id: '3', description: 'Financial verification', completed: false, completedBy: null }
        ],
        updatedBy: user._id.toString(),
        updateNotes: 'KYC checklist partially completed'
      };

      const response = await testSuite.getRequest()
        .patch(`/api/deal-processing/${processingId}/checklist`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklistData)
        .expect(200);

      expect(response.body.checklistType).toBe(checklistData.checklistType);
      expect(response.body.items).toEqual(checklistData.items);
    });

    it('should return 404 for non-existent deal processing', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const checklistData = {
        checklistType: 'KYC',
        items: []
      };

      const response = await testSuite.getRequest()
        .patch(`/api/deal-processing/${nonExistentId}/checklist`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklistData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });
});
