import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS, TEST_CHECKLISTS } from '../../fixtures/test-data';

describe('Due Diligence Checklists Controller (e2e)', () => {
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

  describe('POST /api/due-diligence-checklists/:checklistType', () => {
    it('should create due diligence checklist successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const checklistData = testSuite.testDataFactory.createChecklistData(TEST_CHECKLISTS.KYC);
      checklistData.accountId = account._id.toString();

      const response = await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklistData)
        .expect(201);

      expect(response.body.checklistType).toBe(checklistData.checklistType);
      expect(response.body.version).toBe(checklistData.version);
      expect(response.body.items).toEqual(checklistData.items);
      expect(response.body.accountId).toBe(account._id.toString());
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('version should not be empty');
      expect(response.body.message).toContain('items should not be empty');
    });

    it('should validate checklist type parameter', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const checklistData = testSuite.testDataFactory.createChecklistData(TEST_CHECKLISTS.KYC);

      const response = await testSuite.getRequest()
        .post('/api/due-diligence-checklists/INVALID_TYPE')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklistData)
        .expect(400);

      expect(response.body.message).toContain('checklistType must be one of the following values');
    });

    it('should validate items array', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const checklistData = {
        version: '1.0',
        items: [] // Empty items array
      };

      const response = await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklistData)
        .expect(400);

      expect(response.body.message).toContain('items should not be empty');
    });

    it('should require authentication', async () => {
      const checklistData = testSuite.testDataFactory.createChecklistData(TEST_CHECKLISTS.KYC);

      await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .send(checklistData)
        .expect(401);
    });
  });

  describe('GET /api/due-diligence-checklists/:checklistType/latest', () => {
    it('should get latest due diligence checklist successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a checklist first
      const checklistData = testSuite.testDataFactory.createChecklistData(TEST_CHECKLISTS.KYC);
      checklistData.accountId = account._id.toString();

      await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklistData)
        .expect(201);

      const response = await testSuite.getRequest()
        .get('/api/due-diligence-checklists/KYC/latest')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.checklistType).toBe('KYC');
      expect(response.body.version).toBeDefined();
      expect(response.body.items).toBeDefined();
    });

    it('should return 404 for non-existent checklist type', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/due-diligence-checklists/NONEXISTENT/latest')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      await testSuite.getRequest()
        .get('/api/due-diligence-checklists/KYC/latest')
        .expect(401);
    });
  });

  describe('GET /api/due-diligence-checklists/:checklistType/:version', () => {
    it('should get due diligence checklist by version successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a checklist first
      const checklistData = testSuite.testDataFactory.createChecklistData(TEST_CHECKLISTS.KYC);
      checklistData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklistData)
        .expect(201);

      const version = createResponse.body.version;

      const response = await testSuite.getRequest()
        .get(`/api/due-diligence-checklists/KYC/${version}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.checklistType).toBe('KYC');
      expect(response.body.version).toBe(version);
      expect(response.body.items).toBeDefined();
    });

    it('should return 404 for non-existent version', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/due-diligence-checklists/KYC/999.999')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should validate version format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/due-diligence-checklists/KYC/invalid-version')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(400);

      expect(response.body.message).toContain('version must be a valid version number');
    });
  });

  describe('GET /api/due-diligence-checklists/:checklistType', () => {
    it('should get all due diligence checklists by type successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create multiple checklists
      const checklist1 = testSuite.testDataFactory.createChecklistData(TEST_CHECKLISTS.KYC);
      const checklist2 = testSuite.testDataFactory.createChecklistData({
        ...TEST_CHECKLISTS.KYC,
        version: '2.0'
      });

      checklist1.accountId = account._id.toString();
      checklist2.accountId = account._id.toString();

      await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklist1)
        .expect(201);

      await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklist2)
        .expect(201);

      const response = await testSuite.getRequest()
        .get('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle pagination for checklists', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/due-diligence-checklists/KYC')
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
        .get('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ search: 'identity', status: 'active' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should require authentication', async () => {
      await testSuite.getRequest()
        .get('/api/due-diligence-checklists/KYC')
        .expect(401);
    });
  });

  describe('PATCH /api/due-diligence-checklists/:id/checklist', () => {
    it('should update due diligence checklist instance successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a checklist first
      const checklistData = testSuite.testDataFactory.createChecklistData(TEST_CHECKLISTS.KYC);
      checklistData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklistData)
        .expect(201);

      const checklistId = createResponse.body._id;

      // Update the checklist
      const updateData = {
        items: [
          { id: '1', description: 'Identity verification', completed: true, completedBy: user._id.toString() },
          { id: '2', description: 'Address verification', completed: true, completedBy: user._id.toString() },
          { id: '3', description: 'Financial verification', completed: false, completedBy: null },
          { id: '4', description: 'Reference check', completed: false, completedBy: null }
        ],
        status: 'In Progress',
        updatedBy: user._id.toString(),
        updateNotes: 'Updated checklist with additional items'
      };

      const response = await testSuite.getRequest()
        .patch(`/api/due-diligence-checklists/${checklistId}/checklist`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.items).toEqual(updateData.items);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.updatedBy).toBe(updateData.updatedBy);
    });

    it('should validate items array', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a checklist first
      const checklistData = testSuite.testDataFactory.createChecklistData(TEST_CHECKLISTS.KYC);
      checklistData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklistData)
        .expect(201);

      const checklistId = createResponse.body._id;

      const updateData = {
        items: [] // Empty items array
      };

      const response = await testSuite.getRequest()
        .patch(`/api/due-diligence-checklists/${checklistId}/checklist`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('items should not be empty');
    });

    it('should validate item structure', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a checklist first
      const checklistData = testSuite.testDataFactory.createChecklistData(TEST_CHECKLISTS.KYC);
      checklistData.accountId = account._id.toString();

      const createResponse = await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(checklistData)
        .expect(201);

      const checklistId = createResponse.body._id;

      const updateData = {
        items: [
          { id: '1', description: 'Identity verification' } // Missing required fields
        ]
      };

      const response = await testSuite.getRequest()
        .patch(`/api/due-diligence-checklists/${checklistId}/checklist`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('completed should not be empty');
    });

    it('should return 404 for non-existent checklist', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const updateData = {
        items: [
          { id: '1', description: 'Identity verification', completed: true, completedBy: user._id.toString() }
        ]
      };

      const response = await testSuite.getRequest()
        .patch(`/api/due-diligence-checklists/${nonExistentId}/checklist`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const checklistId = '507f1f77bcf86cd799439011';
      
      const updateData = {
        items: [
          { id: '1', description: 'Identity verification', completed: true, completedBy: '507f1f77bcf86cd799439012' }
        ]
      };

      await testSuite.getRequest()
        .patch(`/api/due-diligence-checklists/${checklistId}/checklist`)
        .send(updateData)
        .expect(401);
    });
  });
});
