import { BaseE2ETest } from '../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS, TEST_TRADE_DOCUMENTS, TEST_DEALS } from '../fixtures/test-data';

describe('End-to-End Integration Workflows (e2e)', () => {
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

  describe('Complete Trade Document Lifecycle', () => {
    it('should handle complete document lifecycle from creation to verification', async () => {
      // 1. Create account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // 2. Create a trade document
      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const createResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = createResponse.body._id;

      // 3. Upload document file
      const fileData = {
        filename: 'invoice.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('PDF content')
      };

      await testSuite.apiHelper.uploadFile(
        `/api/trade-documents/${account._id}/${documentId}/file`,
        fileData,
        token.accessToken
      ).expect(200);

      // 4. Update document status to published
      await testSuite.getRequest()
        .patch(`/api/trade-documents/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ status: 'Published' })
        .expect(200);

      // 5. Create document signing request
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

      // 6. Update signing status to completed
      await testSuite.getRequest()
        .put(`/api/document-signing/${signingId}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ 
          status: 'Completed',
          completedAt: new Date().toISOString()
        })
        .expect(200);

      // 7. Issue the document
      const issueData = {
        issuedBy: user._id.toString(),
        issuedAt: new Date().toISOString(),
        issueReason: 'Document ready for processing'
      };

      await testSuite.getRequest()
        .post(`/api/issue-trade-document/${account._id}/${documentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(issueData)
        .expect(200);

      // 8. Create verification record
      const verificationData = {
        trackingId: `TRK-${Date.now()}`,
        documentId,
        status: 'Verified',
        verifiedAt: new Date().toISOString(),
        accountId: account._id.toString(),
        documentHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      };

      const verifyResponse = await testSuite.getRequest()
        .post('/api/verify-trade-document')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(verificationData)
        .expect(201);

      // 9. Create share link for external access
      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view',
        description: 'External verification access'
      };

      const shareResponse = await testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(201);

      const linkId = shareResponse.body.linkId;

      // 10. Verify external access works
      await testSuite.getRequest()
        .get(`/api/share-links/access/${linkId}`)
        .expect(200);

      // 11. Verify document can be accessed through share link
      await testSuite.getRequest()
        .get(`/api/share-links/access/${linkId}/files/original`)
        .expect(200);

      // 12. Verify tracking ID works for public verification
      await testSuite.getRequest()
        .get(`/api/verify-trade-document/${verificationData.trackingId}`)
        .expect(200);
    });
  });

  describe('Complete Trade Finance Workflow', () => {
    it('should handle complete trade finance workflow from deal creation to funding', async () => {
      // 1. Create account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // 2. Create a trade document first
      const documentData = testSuite.testDataFactory.createTradeDocumentData(TEST_TRADE_DOCUMENTS.INVOICE);
      
      const documentResponse = await testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = documentResponse.body._id;

      // 3. Create a trade finance deal
      const dealData = testSuite.testDataFactory.createDealData(TEST_DEALS.INVOICE_FINANCING);
      dealData.accountId = account._id.toString();
      dealData.documentIds = [documentId];

      const dealResponse = await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(201);

      const dealId = dealResponse.body._id;

      // 4. Execute deal action (approve)
      const actionData = {
        action: 'approve',
        executedBy: user._id.toString(),
        executedAt: new Date().toISOString(),
        metadata: {
          approvalNotes: 'Deal approved after review',
          riskAssessment: 'Low risk'
        }
      };

      await testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals/${dealId}/actions`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(actionData)
        .expect(200);

      // 5. Create deal processing record
      const processingData = {
        dealId,
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: dealData.amount,
        currency: dealData.currency,
        description: 'Processing approved deal'
      };

      const processingResponse = await testSuite.getRequest()
        .post('/api/deal-processing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(processingData)
        .expect(201);

      const processingId = processingResponse.body._id;

      // 6. Create promissory note
      const promissoryNoteData = {
        noteNumber: `PN-${Date.now()}`,
        principalAmount: dealData.amount,
        interestRate: 5.5,
        maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        borrowerInfo: {
          name: account.accountName,
          address: '123 Business Street',
          city: 'New York',
          country: 'United States'
        },
        lenderInfo: {
          name: 'Trade Finance Bank',
          address: '456 Bank Avenue',
          city: 'New York',
          country: 'United States'
        }
      };

      await testSuite.getRequest()
        .post(`/api/deal-processing/${dealId}/promissory-note`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(promissoryNoteData)
        .expect(201);

      // 7. Issue promissory note
      await testSuite.getRequest()
        .patch(`/api/deal-processing/${processingId}/promissory-note/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          issuedBy: user._id.toString(),
          issuedAt: new Date().toISOString(),
          issueNotes: 'Promissory note issued after approval'
        })
        .expect(200);

      // 8. Sign promissory note
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

      // 9. Update funding decision
      await testSuite.getRequest()
        .post(`/api/deal-processing/${processingId}/funding-decision`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          decision: 'Approved',
          decisionBy: user._id.toString(),
          decisionAt: new Date().toISOString(),
          decisionNotes: 'Funding approved after promissory note execution',
          fundingAmount: dealData.amount * 0.9, // 90% of deal amount
          fundingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(200);

      // 10. Update due diligence checklist
      await testSuite.getRequest()
        .patch(`/api/deal-processing/${processingId}/checklist`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          checklistType: 'KYC',
          items: [
            { id: '1', description: 'Identity verification', completed: true, completedBy: user._id.toString() },
            { id: '2', description: 'Address verification', completed: true, completedBy: user._id.toString() },
            { id: '3', description: 'Financial verification', completed: true, completedBy: user._id.toString() },
            { id: '4', description: 'Reference check', completed: true, completedBy: user._id.toString() }
          ],
          status: 'Completed',
          updatedBy: user._id.toString(),
          updateNotes: 'All KYC checks completed successfully'
        })
        .expect(200);

      // 11. Download promissory note
      await testSuite.getRequest()
        .get(`/api/deal-processing/${processingId}/promissory-note/download`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);
    });
  });

  describe('Complete User Onboarding Workflow', () => {
    it('should handle complete user onboarding from registration to account setup', async () => {
      // 1. Customer registration
      const registrationData = {
        companyName: 'New Trading Company Ltd',
        contactEmail: 'contact@newtrading.com',
        contactPhone: '+1-555-0123',
        businessType: 'Trading Company',
        country: 'United States',
        address: {
          street: '123 Business Street',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'United States'
        },
        representative: {
          name: 'Jane Smith',
          title: 'CEO',
          email: 'jane.smith@newtrading.com',
          phone: '+1-555-0124'
        }
      };

      const registrationResponse = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(201);

      const registrationId = registrationResponse.body.registrationId;

      // 2. Upload registration documents
      const documentData = {
        documentType: 'Business License',
        documentName: 'business-license.pdf',
        description: 'Official business license document'
      };

      await testSuite.getRequest()
        .post(`/api/registration/${registrationId}/documents`)
        .send(documentData)
        .expect(201);

      // 3. Admin reviews and approves registration
      const { account: adminAccount, user: adminUser, token: adminToken } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      await testSuite.getRequest()
        .put(`/api/registration/${registrationId}/status`)
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send({
          status: 'Approved',
          reviewedBy: adminUser._id.toString(),
          reviewedAt: new Date().toISOString(),
          reviewNotes: 'Registration approved after document verification',
          nextSteps: 'Account setup will be initiated'
        })
        .expect(200);

      // 4. Create onboarding processing record
      const onboardingData = {
        customerName: registrationData.companyName,
        customerEmail: registrationData.contactEmail,
        status: 'Pending',
        registrationId,
        accountId: adminAccount._id.toString()
      };

      const onboardingResponse = await testSuite.getRequest()
        .post('/api/onboarding')
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send(onboardingData)
        .expect(201);

      const onboardingId = onboardingResponse.body._id;

      // 5. Create due diligence checklist
      const checklistData = {
        checklistType: 'KYC',
        version: '1.0',
        items: [
          { id: '1', description: 'Identity verification', completed: false, completedBy: null },
          { id: '2', description: 'Address verification', completed: false, completedBy: null },
          { id: '3', description: 'Financial verification', completed: false, completedBy: null },
          { id: '4', description: 'Reference check', completed: false, completedBy: null }
        ],
        accountId: adminAccount._id.toString()
      };

      await testSuite.getRequest()
        .post('/api/due-diligence-checklists/KYC')
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send(checklistData)
        .expect(200);

      // 6. Update onboarding decision
      await testSuite.getRequest()
        .post(`/api/onboarding/${onboardingId}/decision`)
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send({
          decision: 'Approved',
          decisionBy: adminUser._id.toString(),
          decisionAt: new Date().toISOString(),
          decisionNotes: 'Customer meets all requirements',
          nextSteps: 'Proceed with account setup',
          metadata: {
            riskLevel: 'Low',
            complianceCheck: 'Passed'
          }
        })
        .expect(200);

      // 7. Create new account for the customer
      const newAccountData = {
        accountName: registrationData.companyName,
        contact: {
          emailAddress: registrationData.contactEmail,
          phoneNumber: registrationData.contactPhone
        },
        status: 'Active',
        businessType: registrationData.businessType,
        address: registrationData.address
      };

      const newAccountResponse = await testSuite.getRequest()
        .post('/api/accounts')
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send(newAccountData)
        .expect(201);

      const newAccountId = newAccountResponse.body._id;

      // 8. Create user for the customer
      const customerUserData = {
        name: registrationData.representative.name,
        emailAddress: registrationData.representative.email,
        walletAddress: '0x1234567890123456789012345678901234567890',
        status: 'Active',
        permissions: [{ module: 'DealDesk', role: 'Agent' }],
        authMethod: 'email-password',
        accountId: newAccountId
      };

      await testSuite.getRequest()
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send(customerUserData)
        .expect(201);

      // 9. Set up tenant configuration
      const tenantConfig = {
        configuration: {
          theme: 'light',
          language: 'en-US',
          timezone: 'America/New_York',
          features: {
            documentSigning: true,
            tradeFinance: true,
            analytics: true
          }
        }
      };

      await testSuite.getRequest()
        .put(`/api/tenant/${newAccountId}`)
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send(tenantConfig)
        .expect(200);

      // 10. Create tenant DID
      const didData = {
        didMethod: 'did:web',
        domain: 'newtrading.example.com',
        metadata: {
          createdBy: adminUser._id.toString(),
          purpose: 'Customer identity verification'
        }
      };

      await testSuite.getRequest()
        .post(`/api/tenant/${newAccountId}/did`)
        .set('Authorization', `Bearer ${adminToken.accessToken}`)
        .send(didData)
        .expect(201);
    });
  });

  describe('Complete Analytics and Audit Workflow', () => {
    it('should handle complete analytics and audit workflow', async () => {
      // 1. Create account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // 2. Create some trade documents for analytics
      const document1 = testSuite.testDataFactory.createTradeDocumentData({
        ...TEST_TRADE_DOCUMENTS.INVOICE,
        title: 'Invoice 1',
        status: 'Published'
      });

      const document2 = testSuite.testDataFactory.createTradeDocumentData({
        ...TEST_TRADE_DOCUMENTS.CONTRACT,
        title: 'Contract 1',
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

      // 3. Create some trade finance deals
      const deal1 = testSuite.testDataFactory.createDealData({
        ...TEST_DEALS.INVOICE_FINANCING,
        dealName: 'Deal 1',
        amount: 50000,
        status: 'Approved'
      });

      const deal2 = testSuite.testDataFactory.createDealData({
        ...TEST_DEALS.ASSET_BASED_LENDING,
        dealName: 'Deal 2',
        amount: 75000,
        status: 'Pending'
      });

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

      // 4. Get trade documents analytics
      const documentsAnalytics = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/summary`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(documentsAnalytics.body.totalDocuments).toBeDefined();
      expect(documentsAnalytics.body.documentsByType).toBeDefined();
      expect(documentsAnalytics.body.documentsByStatus).toBeDefined();

      // 5. Get trade finance analytics
      const financeAnalytics = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-finance/summary`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(financeAnalytics.body.totalDeals).toBeDefined();
      expect(financeAnalytics.body.dealsByType).toBeDefined();
      expect(financeAnalytics.body.dealsByStatus).toBeDefined();
      expect(financeAnalytics.body.totalVolume).toBeDefined();

      // 6. Get recent trade documents
      const recentDocuments = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/recent`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(recentDocuments.body.data).toBeDefined();
      expect(Array.isArray(recentDocuments.body.data)).toBe(true);

      // 7. Get recent trade finance
      const recentFinance = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-finance/recent`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(recentFinance.body.data).toBeDefined();
      expect(Array.isArray(recentFinance.body.data)).toBe(true);

      // 8. Get audit events for user
      const auditEvents = await testSuite.getRequest()
        .get(`/api/audit/user/${user._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(auditEvents.body.data).toBeDefined();
      expect(Array.isArray(auditEvents.body.data)).toBe(true);

      // 9. Get debug analytics (admin only)
      const debugAnalytics = await testSuite.getRequest()
        .get(`/api/analytics/${account._id}/trade-documents/summary/debug`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(debugAnalytics.body.debug).toBeDefined();
      expect(debugAnalytics.body.rawData).toBeDefined();
      expect(debugAnalytics.body.aggregations).toBeDefined();
    });
  });

  describe('Complete User Management Workflow', () => {
    it('should handle complete user management workflow', async () => {
      // 1. Create admin account and user
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // 2. Create module permissions
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

      await testSuite.getRequest()
        .post('/api/module-permissions')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(permissionsData)
        .expect(200);

      // 3. Create users in bulk
      const bulkUserData = {
        users: [
          {
            name: 'Bulk User 1',
            emailAddress: 'bulk-user-1@test.com',
            walletAddress: '0x1111111111111111111111111111111111111111',
            status: 'Active',
            permissions: [{ module: 'DealDesk', role: 'Agent' }],
            authMethod: 'email-password'
          },
          {
            name: 'Bulk User 2',
            emailAddress: 'bulk-user-2@test.com',
            walletAddress: '0x2222222222222222222222222222222222222222',
            status: 'Active',
            permissions: [{ module: 'TradeDocuments', role: 'Viewer' }],
            authMethod: 'email-password'
          }
        ],
        accountId: account._id.toString()
      };

      const bulkResponse = await testSuite.getRequest()
        .post('/api/auth/users/bulk')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(bulkUserData)
        .expect(201);

      expect(bulkResponse.body.success).toBe(true);
      expect(bulkResponse.body.created).toBe(2);

      // 4. Invite additional user
      const inviteData = {
        emailAddress: 'invited-user@test.com',
        name: 'Invited User',
        permissions: [{ module: 'DealDesk', role: 'Agent' }],
        accountId: account._id.toString(),
        invitedBy: user._id.toString(),
        invitationMessage: 'Welcome to our platform!'
      };

      const inviteResponse = await testSuite.getRequest()
        .post('/api/auth/users/invite')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(inviteData)
        .expect(201);

      expect(inviteResponse.body.success).toBe(true);
      expect(inviteResponse.body.invitationToken).toBeDefined();

      // 5. Search users
      const searchResponse = await testSuite.getRequest()
        .get('/api/auth/users/search')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ search: 'bulk', accountId: account._id.toString() })
        .expect(200);

      expect(searchResponse.body.data).toBeDefined();
      expect(searchResponse.body.data.length).toBeGreaterThanOrEqual(2);

      // 6. Update user status
      const firstUser = bulkResponse.body.results[0];
      await testSuite.getRequest()
        .put('/api/auth/users/status')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          userId: firstUser._id,
          status: 'Inactive',
          updatedBy: user._id.toString(),
          reason: 'User requested account suspension'
        })
        .expect(200);

      // 7. Create named wallets
      const wallet1 = {
        name: 'Primary Wallet',
        walletAddress: '0x3333333333333333333333333333333333333333',
        walletType: 'Ethereum',
        description: 'Primary trading wallet'
      };

      const wallet2 = {
        name: 'Secondary Wallet',
        walletAddress: '0x4444444444444444444444444444444444444444',
        walletType: 'Polygon',
        description: 'Secondary trading wallet'
      };

      await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(wallet1)
        .expect(201);

      await testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(wallet2)
        .expect(201);

      // 8. Get named wallets
      const walletsResponse = await testSuite.getRequest()
        .get(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(walletsResponse.body).toBeDefined();
      expect(Array.isArray(walletsResponse.body)).toBe(true);
      expect(walletsResponse.body.length).toBeGreaterThanOrEqual(2);
    });
  });
});
