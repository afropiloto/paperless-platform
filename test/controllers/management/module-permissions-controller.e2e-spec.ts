import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';

describe('Module Permissions Controller (e2e)', () => {
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

  describe('POST /api/module-permissions', () => {
    it('should create or update module permissions successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const permissionsData = {
        module: 'DealDesk',
        roles: [
          {
            role: 'Agent',
            permissions: ['read', 'create', 'update'],
            description: 'Deal desk agent with basic permissions'
          },
          {
            role: 'Admin',
            permissions: ['read', 'create', 'update', 'delete', 'manage'],
            description: 'Deal desk admin with full permissions'
          }
        ],
        accountId: account._id.toString(),
        updatedBy: user._id.toString()
      };

      const response = await testSuite.getRequest()
        .post('/api/module-permissions')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(permissionsData)
        .expect(200);

      expect(response.body.module).toBe(permissionsData.module);
      expect(response.body.roles).toEqual(permissionsData.roles);
      expect(response.body.accountId).toBe(account._id.toString());
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .post('/api/module-permissions')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('module should not be empty');
      expect(response.body.message).toContain('roles should not be empty');
    });

    it('should validate module values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const permissionsData = {
        module: 'InvalidModule', // Invalid module
        roles: [
          {
            role: 'Agent',
            permissions: ['read'],
            description: 'Test role'
          }
        ]
      };

      const response = await testSuite.getRequest()
        .post('/api/module-permissions')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(permissionsData)
        .expect(400);

      expect(response.body.message).toContain('module must be one of the following values');
    });

    it('should validate roles array', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const permissionsData = {
        module: 'DealDesk',
        roles: [] // Empty roles array
      };

      const response = await testSuite.getRequest()
        .post('/api/module-permissions')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(permissionsData)
        .expect(400);

      expect(response.body.message).toContain('roles should not be empty');
    });

    it('should validate role structure', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const permissionsData = {
        module: 'DealDesk',
        roles: [
          {
            role: 'Agent'
            // Missing required fields
          }
        ]
      };

      const response = await testSuite.getRequest()
        .post('/api/module-permissions')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(permissionsData)
        .expect(400);

      expect(response.body.message).toContain('permissions should not be empty');
    });

    it('should require authentication', async () => {
      const permissionsData = {
        module: 'DealDesk',
        roles: [
          {
            role: 'Agent',
            permissions: ['read'],
            description: 'Test role'
          }
        ]
      };

      await testSuite.getRequest()
        .post('/api/module-permissions')
        .send(permissionsData)
        .expect(401);
    });
  });

  describe('GET /api/module-permissions', () => {
    it('should get all active module permissions successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // Create some module permissions first
      const permissionsData1 = {
        module: 'DealDesk',
        roles: [
          {
            role: 'Agent',
            permissions: ['read', 'create'],
            description: 'Deal desk agent'
          }
        ]
      };

      const permissionsData2 = {
        module: 'TradeDocuments',
        roles: [
          {
            role: 'Viewer',
            permissions: ['read'],
            description: 'Document viewer'
          }
        ]
      };

      await testSuite.getRequest()
        .post('/api/module-permissions')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(permissionsData1)
        .expect(200);

      await testSuite.getRequest()
        .post('/api/module-permissions')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(permissionsData2)
        .expect(200);

      const response = await testSuite.getRequest()
        .get('/api/module-permissions')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should require authentication', async () => {
      await testSuite.getRequest()
        .get('/api/module-permissions')
        .expect(401);
    });
  });

  describe('GET /api/module-permissions/:module', () => {
    it('should get module permissions by module ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // Create module permissions first
      const permissionsData = {
        module: 'DealDesk',
        roles: [
          {
            role: 'Agent',
            permissions: ['read', 'create'],
            description: 'Deal desk agent'
          }
        ]
      };

      await testSuite.getRequest()
        .post('/api/module-permissions')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(permissionsData)
        .expect(200);

      const response = await testSuite.getRequest()
        .get('/api/module-permissions/DealDesk')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.module).toBe('DealDesk');
      expect(response.body.roles).toBeDefined();
      expect(Array.isArray(response.body.roles)).toBe(true);
    });

    it('should return 404 for non-existent module', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get('/api/module-permissions/NonExistentModule')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      await testSuite.getRequest()
        .get('/api/module-permissions/DealDesk')
        .expect(401);
    });
  });
});
