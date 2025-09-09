import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS, TEST_NAMED_WALLETS } from '../../fixtures/test-data';

describe('Named Wallets Controller (e2e)', () => {
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

  describe('GET /api/named-wallets/:accountId', () => {
    it('should get named wallets for account successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create some named wallets first
      const walletData1 = testSuite.testDataFactory.createNamedWalletData(TEST_NAMED_WALLETS.ETHEREUM);
      const walletData2 = testSuite.testDataFactory.createNamedWalletData(TEST_NAMED_WALLETS.POLYGON);

      await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(walletData1)
        .expect(201);

      await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(walletData2)
        .expect(201);

      const response = await testSuite.getRequest()
        .get(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 404 for non-existent account', async () => {
      const { user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentAccountId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/named-wallets/${nonExistentAccountId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      await testSuite.getRequest()
        .get(`/api/named-wallets/${account._id}`)
        .expect(401);
    });
  });

  describe('GET /api/named-wallets/:accountId/:walletId', () => {
    it('should get named wallet by ID successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a named wallet first
      const walletData = testSuite.testDataFactory.createNamedWalletData(TEST_NAMED_WALLETS.ETHEREUM);

      const createResponse = await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(walletData)
        .expect(201);

      const walletId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .get(`/api/named-wallets/${account._id}/${walletId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.name).toBe(walletData.name);
      expect(response.body.walletAddress).toBe(walletData.walletAddress);
      expect(response.body.walletType).toBe(walletData.walletType);
    });

    it('should return 404 for non-existent wallet', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentWalletId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/named-wallets/${account._id}/${nonExistentWalletId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/named-wallets/:accountId', () => {
    it('should create named wallet successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const walletData = testSuite.testDataFactory.createNamedWalletData(TEST_NAMED_WALLETS.ETHEREUM);

      const response = await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(walletData)
        .expect(201);

      expect(response.body.name).toBe(walletData.name);
      expect(response.body.walletAddress).toBe(walletData.walletAddress);
      expect(response.body.walletType).toBe(walletData.walletType);
      expect(response.body.description).toBe(walletData.description);
      expect(response.body.accountId).toBe(account._id.toString());
    });

    it('should validate required fields', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('name should not be empty');
      expect(response.body.message).toContain('walletAddress should not be empty');
      expect(response.body.message).toContain('walletType should not be empty');
    });

    it('should validate wallet address format', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const walletData = {
        name: 'Test Wallet',
        walletAddress: 'invalid-address', // Invalid wallet address
        walletType: 'Ethereum',
        description: 'Test wallet'
      };

      const response = await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(walletData)
        .expect(400);

      expect(response.body.message).toContain('walletAddress must be a valid wallet address');
    });

    it('should validate wallet type values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const walletData = {
        name: 'Test Wallet',
        walletAddress: '0x1234567890123456789012345678901234567890',
        walletType: 'InvalidType', // Invalid wallet type
        description: 'Test wallet'
      };

      const response = await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(walletData)
        .expect(400);

      expect(response.body.message).toContain('walletType must be one of the following values');
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);

      const walletData = testSuite.testDataFactory.createNamedWalletData(TEST_NAMED_WALLETS.ETHEREUM);

      await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .send(walletData)
        .expect(401);
    });
  });

  describe('PATCH /api/named-wallets/:accountId/:walletId', () => {
    it('should update named wallet successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a named wallet first
      const walletData = testSuite.testDataFactory.createNamedWalletData(TEST_NAMED_WALLETS.ETHEREUM);

      const createResponse = await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(walletData)
        .expect(201);

      const walletId = createResponse.body._id;

      // Update the wallet
      const updateData = {
        name: 'Updated Wallet Name',
        description: 'Updated wallet description',
        metadata: {
          lastUsed: new Date().toISOString(),
          usageCount: 5
        }
      };

      const response = await testSuite.getRequest()
        .patch(`/api/named-wallets/${account._id}/${walletId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.metadata).toEqual(updateData.metadata);
    });

    it('should return 404 for non-existent wallet', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentWalletId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .patch(`/api/named-wallets/${account._id}/${nonExistentWalletId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should validate wallet address format on update', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a named wallet first
      const walletData = testSuite.testDataFactory.createNamedWalletData(TEST_NAMED_WALLETS.ETHEREUM);

      const createResponse = await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(walletData)
        .expect(201);

      const walletId = createResponse.body._id;

      const updateData = {
        walletAddress: 'invalid-address' // Invalid wallet address
      };

      const response = await testSuite.getRequest()
        .patch(`/api/named-wallets/${account._id}/${walletId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('walletAddress must be a valid wallet address');
    });
  });

  describe('DELETE /api/named-wallets/:accountId/:walletId', () => {
    it('should delete named wallet successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // Create a named wallet first
      const walletData = testSuite.testDataFactory.createNamedWalletData(TEST_NAMED_WALLETS.ETHEREUM);

      const createResponse = await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(walletData)
        .expect(201);

      const walletId = createResponse.body._id;

      const response = await testSuite.getRequest()
        .delete(`/api/named-wallets/${account._id}/${walletId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent wallet', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const nonExistentWalletId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .delete(`/api/named-wallets/${account._id}/${nonExistentWalletId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const { account } = await testSuite.createTestAccount(TEST_ACCOUNTS.BASIC);
      const walletId = '507f1f77bcf86cd799439011';

      await testSuite.getRequest()
        .delete(`/api/named-wallets/${account._id}/${walletId}`)
        .expect(401);
    });
  });
});
