import { BaseE2ETest } from '../../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';

describe('Registration Controller (e2e)', () => {
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

  describe('POST /api/registration', () => {
    it('should register new customer successfully', async () => {
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'contact@testcompany.com',
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
          name: 'John Doe',
          title: 'CEO',
          email: 'john.doe@testcompany.com',
          phone: '+1-555-0124'
        },
        businessRegistration: {
          registrationNumber: 'REG-123456789',
          taxId: 'TAX-987654321',
          incorporationDate: '2020-01-15'
        },
        bankingInfo: {
          bankName: 'Test Bank',
          accountNumber: 'ACC-123456789',
          routingNumber: 'ROUT-987654321',
          swiftCode: 'TESTUS33'
        }
      };

      const response = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.registrationId).toBeDefined();
      expect(response.body.status).toBe('Pending');
      expect(response.body.companyName).toBe(registrationData.companyName);
      expect(response.body.contactEmail).toBe(registrationData.contactEmail);
    });

    it('should validate required fields', async () => {
      const response = await testSuite.getRequest()
        .post('/api/registration')
        .send({})
        .expect(400);

      expect(response.body.message).toContain('companyName should not be empty');
      expect(response.body.message).toContain('contactEmail should not be empty');
      expect(response.body.message).toContain('businessType should not be empty');
    });

    it('should validate email format', async () => {
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'invalid-email', // Invalid email format
        businessType: 'Trading Company',
        country: 'United States'
      };

      const response = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(400);

      expect(response.body.message).toContain('contactEmail must be an email');
    });

    it('should validate business type values', async () => {
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'contact@testcompany.com',
        businessType: 'InvalidType', // Invalid business type
        country: 'United States'
      };

      const response = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(400);

      expect(response.body.message).toContain('businessType must be one of the following values');
    });

    it('should validate phone number format', async () => {
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'contact@testcompany.com',
        businessType: 'Trading Company',
        country: 'United States',
        contactPhone: 'invalid-phone' // Invalid phone format
      };

      const response = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(400);

      expect(response.body.message).toContain('contactPhone must be a valid phone number');
    });

    it('should validate address structure', async () => {
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'contact@testcompany.com',
        businessType: 'Trading Company',
        country: 'United States',
        address: {
          street: '123 Business Street'
          // Missing required address fields
        }
      };

      const response = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(400);

      expect(response.body.message).toContain('city should not be empty');
      expect(response.body.message).toContain('country should not be empty');
    });

    it('should validate representative information', async () => {
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'contact@testcompany.com',
        businessType: 'Trading Company',
        country: 'United States',
        representative: {
          name: 'John Doe'
          // Missing required representative fields
        }
      };

      const response = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(400);

      expect(response.body.message).toContain('email should not be empty');
    });

    it('should handle duplicate email registration', async () => {
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'duplicate@testcompany.com',
        businessType: 'Trading Company',
        country: 'United States'
      };

      // First registration
      await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(201);

      // Duplicate registration
      const response = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(409);

      expect(response.body.message).toContain('Email already registered');
    });
  });

  describe('GET /api/registration/:registrationId', () => {
    it('should get registration by ID successfully', async () => {
      // Create a registration first
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'contact@testcompany.com',
        businessType: 'Trading Company',
        country: 'United States'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(201);

      const registrationId = createResponse.body.registrationId;

      const response = await testSuite.getRequest()
        .get(`/api/registration/${registrationId}`)
        .expect(200);

      expect(response.body.registrationId).toBe(registrationId);
      expect(response.body.companyName).toBe(registrationData.companyName);
      expect(response.body.contactEmail).toBe(registrationData.contactEmail);
      expect(response.body.status).toBe('Pending');
    });

    it('should return 404 for non-existent registration', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/registration/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should validate registration ID format', async () => {
      const invalidId = 'invalid-id';
      
      const response = await testSuite.getRequest()
        .get(`/api/registration/${invalidId}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid registration ID format');
    });
  });

  describe('PUT /api/registration/:registrationId/status', () => {
    it('should update registration status successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // Create a registration first
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'contact@testcompany.com',
        businessType: 'Trading Company',
        country: 'United States'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(201);

      const registrationId = createResponse.body.registrationId;

      // Update status
      const statusData = {
        status: 'Approved',
        reviewedBy: user._id.toString(),
        reviewedAt: new Date().toISOString(),
        reviewNotes: 'Registration approved after verification',
        nextSteps: 'Account setup will be initiated'
      };

      const response = await testSuite.getRequest()
        .put(`/api/registration/${registrationId}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.status).toBe(statusData.status);
      expect(response.body.reviewedBy).toBe(statusData.reviewedBy);
      expect(response.body.reviewNotes).toBe(statusData.reviewNotes);
    });

    it('should validate status values', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // Create a registration first
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'contact@testcompany.com',
        businessType: 'Trading Company',
        country: 'United States'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(201);

      const registrationId = createResponse.body.registrationId;

      const statusData = {
        status: 'InvalidStatus', // Invalid status
        reviewedBy: user._id.toString(),
        reviewedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .put(`/api/registration/${registrationId}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(statusData)
        .expect(400);

      expect(response.body.message).toContain('status must be one of the following values');
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const registrationId = '507f1f77bcf86cd799439011';
      const statusData = {
        status: 'Approved',
        reviewedBy: user._id.toString(),
        reviewedAt: new Date().toISOString()
      };

      const response = await testSuite.getRequest()
        .put(`/api/registration/${registrationId}/status`)
        .set('Authorization', `Bearer ${token.accessToken}`)
        .send(statusData)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      const registrationId = '507f1f77bcf86cd799439011';
      const statusData = {
        status: 'Approved',
        reviewedBy: '507f1f77bcf86cd799439012',
        reviewedAt: new Date().toISOString()
      };

      await testSuite.getRequest()
        .put(`/api/registration/${registrationId}/status`)
        .send(statusData)
        .expect(401);
    });
  });

  describe('GET /api/registration', () => {
    it('should get all registrations successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      // Create some registrations
      const registration1 = {
        companyName: 'Test Company 1',
        contactEmail: 'contact1@testcompany.com',
        businessType: 'Trading Company',
        country: 'United States'
      };

      const registration2 = {
        companyName: 'Test Company 2',
        contactEmail: 'contact2@testcompany.com',
        businessType: 'Manufacturing',
        country: 'Canada'
      };

      await testSuite.getRequest()
        .post('/api/registration')
        .send(registration1)
        .expect(201);

      await testSuite.getRequest()
        .post('/api/registration')
        .send(registration2)
        .expect(201);

      const response = await testSuite.getRequest()
        .get('/api/registration')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle pagination for registrations', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get('/api/registration')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle filtering by status', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get('/api/registration')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ status: 'Pending' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should handle search parameters', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.ADMIN
      );

      const response = await testSuite.getRequest()
        .get('/api/registration')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .query({ search: 'Test Company', businessType: 'Trading Company' })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should require admin permissions', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC // Basic user, not admin
      );

      const response = await testSuite.getRequest()
        .get('/api/registration')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should require authentication', async () => {
      await testSuite.getRequest()
        .get('/api/registration')
        .expect(401);
    });
  });

  describe('POST /api/registration/:registrationId/documents', () => {
    it('should upload registration documents successfully', async () => {
      // Create a registration first
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'contact@testcompany.com',
        businessType: 'Trading Company',
        country: 'United States'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(201);

      const registrationId = createResponse.body.registrationId;

      // Upload documents
      const documentData = {
        documentType: 'Business License',
        documentName: 'business-license.pdf',
        description: 'Official business license document',
        metadata: {
          issueDate: '2020-01-15',
          expiryDate: '2025-01-15',
          issuingAuthority: 'State Business Registry'
        }
      };

      const response = await testSuite.getRequest()
        .post(`/api/registration/${registrationId}/documents`)
        .send(documentData)
        .expect(201);

      expect(response.body.documentType).toBe(documentData.documentType);
      expect(response.body.documentName).toBe(documentData.documentName);
      expect(response.body.registrationId).toBe(registrationId);
    });

    it('should validate document type values', async () => {
      // Create a registration first
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'contact@testcompany.com',
        businessType: 'Trading Company',
        country: 'United States'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(201);

      const registrationId = createResponse.body.registrationId;

      const documentData = {
        documentType: 'InvalidType', // Invalid document type
        documentName: 'document.pdf'
      };

      const response = await testSuite.getRequest()
        .post(`/api/registration/${registrationId}/documents`)
        .send(documentData)
        .expect(400);

      expect(response.body.message).toContain('documentType must be one of the following values');
    });

    it('should return 404 for non-existent registration', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const documentData = {
        documentType: 'Business License',
        documentName: 'document.pdf'
      };

      const response = await testSuite.getRequest()
        .post(`/api/registration/${nonExistentId}/documents`)
        .send(documentData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/registration/:registrationId/documents', () => {
    it('should get registration documents successfully', async () => {
      // Create a registration first
      const registrationData = {
        companyName: 'Test Company Ltd',
        contactEmail: 'contact@testcompany.com',
        businessType: 'Trading Company',
        country: 'United States'
      };

      const createResponse = await testSuite.getRequest()
        .post('/api/registration')
        .send(registrationData)
        .expect(201);

      const registrationId = createResponse.body.registrationId;

      // Upload a document
      const documentData = {
        documentType: 'Business License',
        documentName: 'business-license.pdf',
        description: 'Official business license document'
      };

      await testSuite.getRequest()
        .post(`/api/registration/${registrationId}/documents`)
        .send(documentData)
        .expect(201);

      // Get documents
      const response = await testSuite.getRequest()
        .get(`/api/registration/${registrationId}/documents`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent registration', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await testSuite.getRequest()
        .get(`/api/registration/${nonExistentId}/documents`)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });
  });
});
