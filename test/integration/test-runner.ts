import { BaseE2ETest } from '../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../fixtures/test-data';

/**
 * Integration Test Runner
 * 
 * This utility provides methods to run comprehensive integration tests
 * that span multiple modules and test complex workflows.
 */
export class IntegrationTestRunner {
  private testSuite: BaseE2ETest;

  constructor() {
    this.testSuite = new BaseE2ETest();
  }

  async setup(): Promise<void> {
    await this.testSuite.beforeAll();
  }

  async teardown(): Promise<void> {
    await this.testSuite.afterAll();
  }

  async cleanup(): Promise<void> {
    await this.testSuite.afterEach();
  }

  /**
   * Run a complete document lifecycle test
   */
  async runDocumentLifecycleTest(): Promise<{
    success: boolean;
    documentId: string;
    signingId: string;
    verificationId: string;
    shareLinkId: string;
  }> {
    try {
      // 1. Create account and user
      const { account, user, token } = await this.testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // 2. Create document
      const documentData = this.testSuite.testDataFactory.createTradeDocumentData({
        title: 'Integration Test Document',
        documentType: 'Invoice',
        status: 'Draft'
      });

      const documentResponse = await this.testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = documentResponse.body._id;

      // 3. Upload file
      const fileData = {
        filename: 'test-document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('PDF content')
      };

      await this.testSuite.apiHelper.uploadFile(
        `/api/trade-documents/${account._id}/${documentId}/file`,
        fileData,
        token.accessToken
      ).expect(200);

      // 4. Publish document
      await this.testSuite.getRequest()
        .patch(`/api/trade-documents/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ status: 'Published' })
        .expect(200);

      // 5. Create signing request
      const signingData = {
        documentId,
        signers: [user.walletAddress],
        expirationDays: 30,
        status: 'Pending',
        accountId: account._id.toString()
      };

      const signingResponse = await this.testSuite.getRequest()
        .post('/api/document-signing')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(signingData)
        .expect(201);

      const signingId = signingResponse.body._id;

      // 6. Complete signing
      await this.testSuite.getRequest()
        .put(`/api/document-signing/${signingId}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({ 
          status: 'Completed',
          completedAt: new Date().toISOString()
        })
        .expect(200);

      // 7. Issue document
      await this.testSuite.getRequest()
        .post(`/api/issue-trade-document/${account._id}/${documentId}/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          issuedBy: user._id.toString(),
          issuedAt: new Date().toISOString(),
          issueReason: 'Document ready for processing'
        })
        .expect(200);

      // 8. Create verification
      const verificationData = {
        trackingId: `TRK-${Date.now()}`,
        documentId,
        status: 'Verified',
        verifiedAt: new Date().toISOString(),
        accountId: account._id.toString(),
        documentHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      };

      const verifyResponse = await this.testSuite.getRequest()
        .post('/api/verify-trade-document')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(verificationData)
        .expect(201);

      const verificationId = verifyResponse.body._id;

      // 9. Create share link
      const shareLinkData = {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accessLevel: 'view',
        description: 'External verification access'
      };

      const shareResponse = await this.testSuite.getRequest()
        .post(`/api/share-links/${account._id}/${documentId}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(shareLinkData)
        .expect(201);

      const shareLinkId = shareResponse.body.linkId;

      return {
        success: true,
        documentId,
        signingId,
        verificationId,
        shareLinkId
      };
    } catch (error) {
      console.error('Document lifecycle test failed:', error);
      return {
        success: false,
        documentId: '',
        signingId: '',
        verificationId: '',
        shareLinkId: ''
      };
    }
  }

  /**
   * Run a complete trade finance workflow test
   */
  async runTradeFinanceWorkflowTest(): Promise<{
    success: boolean;
    dealId: string;
    processingId: string;
    promissoryNoteId: string;
  }> {
    try {
      // 1. Create account and user
      const { account, user, token } = await this.testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      // 2. Create document
      const documentData = this.testSuite.testDataFactory.createTradeDocumentData({
        title: 'Finance Test Document',
        documentType: 'Invoice',
        status: 'Published'
      });

      const documentResponse = await this.testSuite.getRequest()
        .post(`/api/trade-documents/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(documentData)
        .expect(201);

      const documentId = documentResponse.body._id;

      // 3. Create deal
      const dealData = this.testSuite.testDataFactory.createDealData({
        dealName: 'Integration Test Deal',
        dealType: 'Invoice Financing',
        amount: 100000,
        currency: 'USD',
        status: 'Pending',
        accountId: account._id.toString(),
        documentIds: [documentId]
      });

      const dealResponse = await this.testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(dealData)
        .expect(201);

      const dealId = dealResponse.body._id;

      // 4. Approve deal
      await this.testSuite.getRequest()
        .post(`/api/trade-finance/${account._id}/deals/${dealId}/actions`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          action: 'approve',
          executedBy: user._id.toString(),
          executedAt: new Date().toISOString(),
          metadata: {
            approvalNotes: 'Deal approved after review',
            riskAssessment: 'Low risk'
          }
        })
        .expect(200);

      // 5. Create processing record
      const processingData = {
        dealId,
        accountId: account._id.toString(),
        status: 'Pending',
        processingType: 'Invoice Financing',
        amount: dealData.amount,
        currency: dealData.currency,
        description: 'Processing approved deal'
      };

      const processingResponse = await this.testSuite.getRequest()
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

      const promissoryResponse = await this.testSuite.getRequest()
        .post(`/api/deal-processing/${dealId}/promissory-note`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(promissoryNoteData)
        .expect(201);

      const promissoryNoteId = promissoryResponse.body._id;

      // 7. Issue promissory note
      await this.testSuite.getRequest()
        .patch(`/api/deal-processing/${processingId}/promissory-note/issue`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          issuedBy: user._id.toString(),
          issuedAt: new Date().toISOString(),
          issueNotes: 'Promissory note issued after approval'
        })
        .expect(200);

      // 8. Sign promissory note
      await this.testSuite.getRequest()
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
      await this.testSuite.getRequest()
        .post(`/api/deal-processing/${processingId}/funding-decision`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          decision: 'Approved',
          decisionBy: user._id.toString(),
          decisionAt: new Date().toISOString(),
          decisionNotes: 'Funding approved after promissory note execution',
          fundingAmount: dealData.amount * 0.9,
          fundingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(200);

      return {
        success: true,
        dealId,
        processingId,
        promissoryNoteId
      };
    } catch (error) {
      console.error('Trade finance workflow test failed:', error);
      return {
        success: false,
        dealId: '',
        processingId: '',
        promissoryNoteId: ''
      };
    }
  }

  /**
   * Run a complete user management workflow test
   */
  async runUserManagementWorkflowTest(): Promise<{
    success: boolean;
    accountId: string;
    userIds: string[];
    invitationId: string;
  }> {
    try {
      // 1. Create admin account and user
      const { account, user, token } = await this.testSuite.createAndLoginUser(
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

      await this.testSuite.getRequest()
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

      const bulkResponse = await this.testSuite.getRequest()
        .post('/api/auth/users/bulk')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(bulkUserData)
        .expect(201);

      const userIds = bulkResponse.body.results.map((result: any) => result._id);

      // 4. Invite additional user
      const inviteData = {
        emailAddress: 'invited-user@test.com',
        name: 'Invited User',
        permissions: [{ module: 'DealDesk', role: 'Agent' }],
        accountId: account._id.toString(),
        invitedBy: user._id.toString(),
        invitationMessage: 'Welcome to our platform!'
      };

      const inviteResponse = await this.testSuite.getRequest()
        .post('/api/auth/users/invite')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(inviteData)
        .expect(201);

      const invitationId = inviteResponse.body._id;

      // 5. Update user status
      await this.testSuite.getRequest()
        .put('/api/auth/users/status')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send({
          userId: userIds[0],
          status: 'Inactive',
          updatedBy: user._id.toString(),
          reason: 'User requested account suspension'
        })
        .expect(200);

      // 6. Create named wallets
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

      await this.testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(wallet1)
        .expect(201);

      await this.testSuite.getRequest()
        .post(`/api/named-wallets/${account._id}`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(wallet2)
        .expect(201);

      return {
        success: true,
        accountId: account._id.toString(),
        userIds,
        invitationId
      };
    } catch (error) {
      console.error('User management workflow test failed:', error);
      return {
        success: false,
        accountId: '',
        userIds: [],
        invitationId: ''
      };
    }
  }

  /**
   * Run all integration tests
   */
  async runAllIntegrationTests(): Promise<{
    documentLifecycle: any;
    tradeFinanceWorkflow: any;
    userManagementWorkflow: any;
    overallSuccess: boolean;
  }> {
    console.log('Starting integration tests...');

    const documentLifecycle = await this.runDocumentLifecycleTest();
    console.log('Document lifecycle test:', documentLifecycle.success ? 'PASSED' : 'FAILED');

    const tradeFinanceWorkflow = await this.runTradeFinanceWorkflowTest();
    console.log('Trade finance workflow test:', tradeFinanceWorkflow.success ? 'PASSED' : 'FAILED');

    const userManagementWorkflow = await this.runUserManagementWorkflowTest();
    console.log('User management workflow test:', userManagementWorkflow.success ? 'PASSED' : 'FAILED');

    const overallSuccess = documentLifecycle.success && 
                          tradeFinanceWorkflow.success && 
                          userManagementWorkflow.success;

    console.log('Overall integration tests:', overallSuccess ? 'PASSED' : 'FAILED');

    return {
      documentLifecycle,
      tradeFinanceWorkflow,
      userManagementWorkflow,
      overallSuccess
    };
  }
}

export default IntegrationTestRunner;
