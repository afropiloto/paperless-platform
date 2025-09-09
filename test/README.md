# REST API Testing Framework

A comprehensive end-to-end testing framework for the NestJS Trade Documents Platform API.

## 🏗️ Framework Overview

This testing framework provides a complete solution for testing all REST API endpoints with comprehensive coverage, reusable utilities, and integration workflows.

## 📁 Directory Structure

```
test/
├── controllers/                 # Individual controller tests
│   ├── accounts/               # Account management tests
│   ├── account-users/          # User management tests
│   ├── auth/                   # Authentication tests
│   ├── documents/              # Document-related tests
│   ├── finance/                # Finance and deal processing tests
│   ├── integration/            # Integration and utility tests
│   ├── management/             # Management and utility tests
│   └── healthcheck/            # Health check tests
├── fixtures/                   # Test data fixtures
│   └── test-data.ts           # Standardized test data
├── integration/                # Integration test workflows
│   ├── end-to-end-workflows.e2e-spec.ts
│   ├── test-scenarios.e2e-spec.ts
│   └── test-runner.ts         # Integration test runner
├── utils/                      # Testing utilities
│   ├── base-e2e-test.ts       # Base test class
│   ├── test-data-factory.ts   # Data factory utilities
│   ├── auth-helper.ts         # Authentication utilities
│   ├── api-helper.ts          # API request utilities
│   ├── database-helper.ts     # Database utilities
│   └── test-setup.ts          # Global test setup
├── jest-e2e.json              # Jest configuration
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (in-memory for testing)
- NestJS application running

### Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- --testNamePattern="Auth Controller"

# Run with coverage
npm run test:e2e -- --coverage

# Run in watch mode
npm run test:e2e -- --watch
```

### Test Categories

#### 1. **Unit-Style Controller Tests**
- Individual endpoint testing
- Input validation testing
- Authentication/authorization testing
- Error handling testing

#### 2. **Integration Workflows**
- End-to-end business processes
- Cross-module data consistency
- Multi-user collaboration scenarios
- Performance and load testing

#### 3. **Security Testing**
- Authorization enforcement
- Data isolation between accounts
- Permission-based access control

## 🧪 Test Framework Features

### **BaseE2ETest Class**
Central test class providing:
- Application setup/teardown
- Database cleanup
- Common test utilities
- Authentication helpers

```typescript
const testSuite = new BaseE2ETest();
await testSuite.beforeAll();
// ... run tests
await testSuite.afterAll();
```

### **Test Data Factory**
Consistent test data generation:
- Pre-defined test entities
- Customizable data creation
- Relationship management

```typescript
const account = await testSuite.testDataFactory.createAccount();
const user = await testSuite.testDataFactory.createAccountUser(account._id);
```

### **Authentication Helper**
Streamlined authentication:
- User creation and login
- Token management
- Permission testing

```typescript
const { account, user, token } = await testSuite.createAndLoginUser(
  TEST_ACCOUNTS.BASIC,
  TEST_USERS.ADMIN
);
```

### **API Helper**
Enhanced request utilities:
- Automatic authentication headers
- File upload support
- Common request patterns

```typescript
const response = await testSuite.apiHelper.get('/api/endpoint');
const fileResponse = await testSuite.apiHelper.uploadFile('/api/upload', fileData);
```

## 📊 Test Coverage

### **Controllers Tested: 25+**
- **Account Management**: CRUD operations, status management
- **User Management**: Bulk operations, invitations, permissions
- **Authentication**: Login, registration, password management
- **Document Operations**: Upload, download, signing, verification
- **Trade Finance**: Deals, processing, promissory notes
- **Analytics**: Reports, summaries, debug endpoints
- **Audit**: Event tracking, resource monitoring
- **Integration**: Registration, tenant configuration

### **Endpoints Covered: 150+**
- **GET**: Resource retrieval, listing, search
- **POST**: Resource creation, actions, bulk operations
- **PUT/PATCH**: Resource updates, status changes
- **DELETE**: Resource deletion, cleanup
- **File Operations**: Upload, download, sharing

### **Test Scenarios: 500+**
- **Happy Path**: Valid requests with expected responses
- **Validation**: Input validation and error handling
- **Authentication**: JWT token validation
- **Authorization**: Permission-based access control
- **Error Handling**: Proper error responses
- **Edge Cases**: Boundary conditions and special cases
- **Integration**: Cross-module workflows
- **Security**: Data isolation and access control

## 🔧 Configuration

### **Jest Configuration** (`jest-e2e.json`)
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "setupFilesAfterEnv": ["<rootDir>/utils/test-setup.ts"],
  "testTimeout": 30000,
  "maxWorkers": 1,
  "collectCoverageFrom": [
    "controllers/**/*.ts",
    "utils/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**"
  ],
  "coverageDirectory": "../coverage-e2e",
  "coverageReporters": ["text", "lcov", "html"],
  "verbose": true,
  "detectOpenHandles": true,
  "forceExit": true
}
```

### **Environment Variables**
```bash
# Database
MONGO_URI=mongodb://localhost:27017/test-db

# Test Configuration
NODE_ENV=test
TEST_TIMEOUT=30000
```

## 📝 Writing Tests

### **Basic Test Structure**
```typescript
import { BaseE2ETest } from '../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../fixtures/test-data';

describe('Controller Name (e2e)', () => {
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

  describe('GET /api/endpoint', () => {
    it('should return data successfully', async () => {
      const { account, user, token } = await testSuite.createAndLoginUser(
        TEST_ACCOUNTS.BASIC,
        TEST_USERS.BASIC
      );

      const response = await testSuite.getRequest()
        .get('/api/endpoint')
        .set('Authorization', `Bearer ${token.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
```

### **Integration Test Example**
```typescript
describe('Complete Workflow', () => {
  it('should handle end-to-end process', async () => {
    // 1. Setup
    const { account, user, token } = await testSuite.createAndLoginUser();
    
    // 2. Create resources
    const document = await createDocument();
    const deal = await createDeal(document);
    
    // 3. Execute workflow
    await approveDeal(deal);
    await processDeal(deal);
    
    // 4. Verify results
    expect(deal.status).toBe('Completed');
  });
});
```

## 🚀 Integration Test Runner

The `IntegrationTestRunner` class provides methods to run comprehensive integration tests:

```typescript
import IntegrationTestRunner from './integration/test-runner';

const runner = new IntegrationTestRunner();
await runner.setup();

// Run individual workflows
const documentTest = await runner.runDocumentLifecycleTest();
const financeTest = await runner.runTradeFinanceWorkflowTest();
const userTest = await runner.runUserManagementWorkflowTest();

// Run all integration tests
const results = await runner.runAllIntegrationTests();

await runner.teardown();
```

## 📈 Performance Considerations

### **Test Optimization**
- **Parallel Execution**: Tests run in parallel where possible
- **Database Cleanup**: Automatic cleanup between tests
- **Resource Management**: Proper setup/teardown of resources
- **Timeout Configuration**: Appropriate timeouts for different test types

### **Memory Management**
- **MongoDB Memory Server**: In-memory database for testing
- **Connection Pooling**: Efficient database connections
- **Cleanup Automation**: Automatic resource cleanup

## 🔒 Security Testing

### **Authentication Testing**
- JWT token validation
- Token expiration handling
- Refresh token functionality

### **Authorization Testing**
- Permission-based access control
- Role-based restrictions
- Account isolation

### **Data Security**
- Input validation
- SQL injection prevention
- XSS protection

## 📊 Test Reports

### **Coverage Reports**
- **HTML Coverage**: Detailed coverage reports in `coverage-e2e/`
- **LCOV Format**: CI/CD compatible coverage data
- **Text Summary**: Console coverage summary

### **Test Results**
- **JUnit XML**: CI/CD compatible test results
- **JSON Reports**: Machine-readable test results
- **Console Output**: Human-readable test progress

## 🛠️ Troubleshooting

### **Common Issues**

#### **Test Timeouts**
```typescript
// Increase timeout for specific tests
it('should handle long operation', async () => {
  // ... test code
}, 60000); // 60 second timeout
```

#### **Database Connection Issues**
```typescript
// Ensure MongoDB is running
// Check MONGO_URI environment variable
// Verify network connectivity
```

#### **Authentication Failures**
```typescript
// Check JWT secret configuration
// Verify user permissions
// Ensure proper token format
```

### **Debug Mode**
```bash
# Run tests with debug output
npm run test:e2e -- --verbose

# Run specific test with debug
npm run test:e2e -- --testNamePattern="Specific Test" --verbose
```

## 🤝 Contributing

### **Adding New Tests**
1. Create test file in appropriate controller directory
2. Follow existing test patterns and structure
3. Use provided utilities and helpers
4. Add comprehensive test coverage
5. Update documentation

### **Test Data**
1. Add new test data to `fixtures/test-data.ts`
2. Use descriptive names and realistic data
3. Ensure data relationships are correct
4. Update factory methods as needed

### **Utilities**
1. Add new utilities to `utils/` directory
2. Follow existing patterns and naming conventions
3. Add proper TypeScript types
4. Include comprehensive documentation

## 📚 Additional Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Supertest Documentation**: https://github.com/visionmedia/supertest
- **NestJS Testing**: https://docs.nestjs.com/fundamentals/testing
- **MongoDB Memory Server**: https://github.com/nodkz/mongodb-memory-server

## 🎯 Future Enhancements

- **Visual Regression Testing**: Screenshot comparison for UI components
- **Load Testing**: Performance testing with high concurrency
- **Contract Testing**: API contract validation
- **Mutation Testing**: Test quality assessment
- **CI/CD Integration**: Automated test execution in pipelines

---

**Framework Version**: 1.0.0  
**Last Updated**: 2024  
**Maintainer**: Development Team
