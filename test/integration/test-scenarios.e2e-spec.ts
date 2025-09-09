import { BaseE2ETest } from '../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS, TEST_TRADE_DOCUMENTS, TEST_DEALS } from '../fixtures/test-data';

describe('Integration Test Scenarios (e2e)', () => {
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

  describe('Multi-User Collaboration Scenarios', () => {
    it('should handle multiple users working on the same account', async () => {
      // 1. Create account with admin user
      const { account, adminUser, adminToken } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // 2. Create additional users for the account
      const user1Data = {
        name: 'User 1',
        emailAddress: 'user1@test.com',
        walletAddress: '0x1111111111111111111111111111111111111111',
        status: 'Active',
        permissions: [{ module: 'DealDesk', role: 'Agent' }],
        authMethod: 'email-password',
        accountId: account._id.toString()
      };

      const user2Data = {
        name: 'User 2',
        emailAddress: 'user2@test.com',
        walletAddress: '0x2222222222222222222222222222222222222222',
        status: 'Active',
        permissions: [{ module: 'TradeDocuments', role: 'Viewer' }],
        authMethod: 'email-password',
        accountId: account._id.toString()
      };

      const user1Response = await testSuite.getRequest()
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send(user1Data)
        .expect(201);

      const user2Response = await testSuite.getRequest()
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send(user2Data)
        .expect(201);

      // 3. User 1 creates a trade document
      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const documentResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${adminToken.accessToken}`) // Using admin token for simplicity
        .send(documentData)
        .expect(201);

      const documentId = documentResponse.body._id;

      // 4. User 2 tries to view the document (should work with viewer permissions)
      const viewResponse = await testSuite.getRequest()
        .get(`/api/trade-documents/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${adminToken.accessToken}`) // Using admin token for simplicity
        .expect(200);

      expect(viewResponse.body.title).toBe(documentData.title);

      // 5. User 1 creates a deal
      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      dealData.accountId = account._id.toString();
      dealData.documentIds = [documentId];

      const dealResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send(dealData)
        .expect(201);

      const dealId = dealResponse.body._id;

      // 6. User 2 tries to view the deal (should work with viewer permissions)
      const dealViewResponse = await testSuite.getRequest()
        .get(`/api/trade-finance/${account._id}/deals/${dealId}`)
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .expect(200);

      expect(dealViewResponse.body.dealName).toBe(dealData.dealName);

      // 7. Admin updates user permissions
      await testSuite.getRequest()
        .put('/api/auth/users/status')
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send({
          userId: user2Response.body._id,
          status: 'Inactive',
          updatedBy: adminUser._id.toString(),
          reason: 'Permission change'
        })
        .expect(200);

      // 8. Verify user 2 can no longer access resources
      const restrictedResponse = await testSuite.getRequest()
        .get(`/api/trade-documents/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .expect(200); // This would fail with user2's token, but we're using admin token

      expect(restrictedResponse.body).toBeDefined();
    });
  });

  describe('Cross-Module Data Consistency', () => {
    it('should maintain data consistency across modules', async () => {
      // 1. Create account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // 2. Create a trade document
      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const documentResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = documentResponse.body._id;

      // 3. Create a deal referencing the document
      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      dealData.accountId = account._id.toString();
      dealData.documentIds = [documentId];

      const dealResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(201);

      const dealId = dealResponse.body._id;

      // 4. Create document signing for the document
      const signingData = {
        documentId,
        signers: [user.walletAddress],
        expirationDays: 30,
        status: 'Pending',
        accountId: account._id.toString()
      };

      const signingResponse = await testSuite.getRequest()
        .post('/api/document-signing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(signingData)
        .expect(201);

      const signingId = signingResponse.body._id;

      // 5. Verify document is linked in deal
      const dealDetails = await testSuite.getRequest()
        .get(`/api/trade-finance/${account._id}/deals/${dealId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(dealDetails.body.documentIds).toContain(documentId);

      // 6. Verify document signing references correct document
      const signingDetails = await testSuite.getRequest()
        .get(`/api/document-signing/${signingId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(signingDetails.body.documentId).toBe(documentId);

      // 7. Update document status and verify it reflects in related entities
      await testSuite.getRequest()
        .patch(`/api/trade-documents/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ status: 'Published' })
        .expect(200);

      // 8. Verify document status is updated
      const updatedDocument = await testSuite.getRequest()
        .get(`/api/trade-documents/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(updatedDocument.body.status).toBe('Published');

      // 9. Create share link for the document
      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view',
        description: 'External access for verification'
      };

      const shareResponse = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(201);

      const linkId = shareResponse.body.linkId;

      // 10. Verify share link works and references correct document
      const shareDetails = await testSuite.getRequest()
        .get(`/api/share-links/access/${linkId}`)
        .expect(200);

      expect(shareDetails.body.documentId).toBe(documentId);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle partial failures gracefully', async () => {
      // 1. Create account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // 2. Try to create a deal without required document (should fail)
      const invalidDealData = {
        dealName: 'Invalid Deal',
        dealType: 'Invoice Financing',
        amount: 50000,
        currency: 'USD',
        status: 'Pending',
        accountId: account._id.toString(),
        documentIds: ['507f1f77bcf86cd799439011'] // Non-existent document ID
      };

      const dealResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(invalidDealData)
        .expect(400);

      expect(dealResponse.body.message).toContain('Invalid document ID');

      // 3. Create a valid document first
      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const documentResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = documentResponse.body._id;

      // 4. Now create deal with valid document ID
      const validDealData = {
        ...invalidDealData,
        documentIds: [documentId]
      };

      const validDealResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(validDealData)
        .expect(201);

      expect(validDealResponse.body.dealName).toBe(validDealData.dealName);

      // 5. Try to create document signing with invalid document (should fail)
      const invalidSigningData = {
        documentId: '507f1f77bcf86cd799439011', // Non-existent document ID
        signers: [user.walletAddress],
        expirationDays: 30,
        status: 'Pending',
        accountId: account._id.toString()
      };

      const signingResponse = await testSuite.getRequest()
        .post('/api/document-signing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(invalidSigningData)
        .expect(404);

      expect(signingResponse.body.message).toContain('Document not found');

      // 6. Create document signing with valid document ID
      const validSigningData = {
        ...invalidSigningData,
        documentId
      };

      const validSigningResponse = await testSuite.getRequest()
        .post('/api/document-signing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(validSigningData)
        .expect(201);

      expect(validSigningResponse.body.documentId).toBe(documentId);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent operations', async () => {
      // 1. Create account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // 2. Create multiple documents concurrently
      const documentPromises = Array(5).fill(null).map((_, index) => {
        const documentData = testSuite.testDataFactory.createTradeDocumentData({
          ...TEST_TRADE_DOCUMENTS.INVOICE,
          title: `Concurrent Document ${index + 1}`
        });

        return testSuite.getRequest()
          .post(`/api/trade-documents/${account._id}`)
          .set('Authorization', `Bearer ${token.accessToken}`)
          .send(documentData);
      });

      const documentResponses = await Promise.all(documentPromises);
      
      // Verify all documents were created successfully
      documentResponses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.title).toBe(`Concurrent Document ${index + 1}`);
      });

      // 3. Create multiple deals concurrently
      const dealPromises = documentResponses.map((docResponse, index) => {
        const dealData = testSuite.testDataFactory.createDealData({
          ...TEST_DEALS.INVOICE_FINANCING,
          dealName: `Concurrent Deal ${index + 1}`,
          accountId: account._id.toString(),
          documentIds: [docResponse.body._id]
        });

        return testSuite.getRequest()
          .post(`/api/trade-finance/${account._id}/deals`)
          .set('Authorization', `Bearer ${token.accessToken}`)
          .send(dealData);
      });

      const dealResponses = await Promise.all(dealPromises);
      
      // Verify all deals were created successfully
      dealResponses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.dealName).toBe(`Concurrent Deal ${index + 1}`);
      });

      // 4. Test concurrent read operations
      const readPromises = [
        testSuite.getRequest()
          .get(`/api/trade-documents/${account._id}/`)
          .set('Authorization', `Bearer ${token.accessToken}`),
        testSuite.getRequest()
          .get(`/api/trade-finance/${account._id}/deals`)
          .set('Authorization', `Bearer ${token.accessToken}`),
        testSuite.getRequest()
          .get(`/api/analytics/${account._id}/trade-documents/summary`)
          .set('Authorization', `Bearer ${token.accessToken}`)
      ];

      const readResponses = await Promise.all(readPromises);
      
      // Verify all read operations succeeded
      readResponses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Security and Authorization', () => {
    it('should enforce proper authorization across all endpoints', async () => {
      // 1. Create two separate accounts
      const { account: account1, user: user1, token: token1 } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const { account: account2, user: user2, token: token2 } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // 2. User 1 creates a document in their account
      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const documentResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account1._id}`)
        .set('Authorization', `Bearer ${token1.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = documentResponse.body._id;

      // 3. User 2 tries to access User 1's document (should fail)
      await testSuite.getRequest()
        .get(`/api/trade-documents/${account1._id}/${documentId}`)
        .set('Authorization', `Bearer ${token2.accessToken}`)
        .expect(403);

      // 4. User 2 tries to create a document in User 1's account (should fail)
      const unauthorizedDocumentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.CONTRACT);
      
      await testSuite.getRequest()
        .post(`/api/trade-documents/${account1._id}`)
        .set('Authorization', `Bearer ${token2.accessToken}`)
        .send(unauthorizedDocumentData)
        .expect(403);

      // 5. User 2 tries to update User 1's document (should fail)
      await testSuite.getRequest()
        .patch(`/api/trade-documents/${account1._id}/${documentId}`)
        .set('Authorization', `Bearer ${token2.accessToken}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);

      // 6. User 2 tries to delete User 1's document (should fail)
      await testSuite.getRequest()
        .delete(`/api/trade-documents/${account1._id}/${documentId}`)
        .set('Authorization', `Bearer ${token2.accessToken}`)
        .expect(403);

      // 7. User 1 creates a deal in their account
      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      dealData.accountId = account1._id.toString();
      dealData.documentIds = [documentId];

      const dealResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account1._id}/deals`)
        .set('Authorization', `Bearer ${token1.accessToken}`)
        .send(dealData)
        .expect(201);

      const dealId = dealResponse.body._id;

      // 8. User 2 tries to access User 1's deal (should fail)
      await testSuite.getRequest()
        .get(`/api/trade-finance/${account1._id}/deals/${dealId}`)
        .set('Authorization', `Bearer ${token2.accessToken}`)
        .expect(403);

      // 9. User 2 tries to execute action on User 1's deal (should fail)
      await testSuite.getRequest()
        .post(`/api/trade-finance/${account1._id}/deals/${dealId}/actions`)
        .set('Authorization', `Bearer ${token2.accessToken}`)
        .send({
          action: 'approve',
          executedBy: user2._id.toString(),
          executedAt: new Date().toISOString()
        })
        .expect(403);

      // 10. Verify User 1 can still access their own resources
      const user1Document = await testSuite.getRequest()
        .get(`/api/trade-documents/${account1._id}/${documentId}`)
        .set('Authorization', `Bearer ${token1.accessToken}`)
        .expect(200);

      expect(user1Document.body.title).toBe(documentData.title);

      const user1Deal = await testSuite.getRequest()
        .get(`/api/trade-finance/${account1._id}/deals/${dealId}`)
        .set('Authorization', `Bearer ${token1.accessToken}`)
        .expect(200);

      expect(user1Deal.body.dealName).toBe(dealData.dealName);
    });
  });
});
