# 🧪 Comprehensive Testing Guide

This guide provides detailed information about the REST API testing framework, including setup, usage, best practices, and troubleshooting.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Framework Architecture](#framework-architecture)
3. [Writing Tests](#writing-tests)
4. [Test Categories](#test-categories)
5. [Performance Testing](#performance-testing)
6. [Integration Testing](#integration-testing)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Topics](#advanced-topics)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (in-memory for testing)
- Redis (for caching)
- NestJS application running

### Installation

```bash
# Install dependencies
npm install

# Install test-specific dependencies
npm install --save-dev jest supertest @types/supertest mongodb-memory-server

# Run tests
npm run test:e2e
```

### Basic Test Structure

```typescript
import { BaseE2ETest } from '../utils/base-e2e-test';
import { TEST_ACCOUNTS, TEST_USERS } from '../fixtures/test-data';

describe('My Controller (e2e)', () => {
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

  it('should perform a test', async () => {
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
```

## 🏗️ Framework Architecture

### Core Components

#### 1. **BaseE2ETest Class**
Central test class providing:
- Application setup/teardown
- Database cleanup
- Common test utilities
- Authentication helpers

#### 2. **Test Data Factory**
Consistent test data generation:
- Pre-defined test entities
- Customizable data creation
- Relationship management

#### 3. **Authentication Helper**
Streamlined authentication:
- User creation and login
- Token management
- Permission testing

#### 4. **API Helper**
Enhanced request utilities:
- Automatic authentication headers
- File upload support
- Common request patterns

#### 5. **Database Helper**
Database management:
- In-memory MongoDB setup
- Collection cleanup
- Connection management

### Directory Structure

```
test/
├── controllers/           # Individual controller tests
│   ├── accounts/         # Account management tests
│   ├── auth/            # Authentication tests
│   ├── documents/       # Document-related tests
│   ├── finance/         # Finance and deal processing tests
│   ├── integration/     # Integration and utility tests
│   ├── management/      # Management and utility tests
│   └── healthcheck/     # Health check tests
├── fixtures/            # Test data fixtures
├── integration/         # Integration test workflows
├── utils/              # Testing utilities
├── config/             # Test configuration
└── docs/               # Documentation
```

## ✍️ Writing Tests

### Test Categories

#### 1. **Unit-Style Controller Tests**
Test individual endpoints with focused scenarios:

```typescript
describe('GET /api/users', () => {
  it('should return users successfully', async () => {
    // Test implementation
  });

  it('should handle pagination', async () => {
    // Test implementation
  });

  it('should validate input parameters', async () => {
    // Test implementation
  });
});
```

#### 2. **Integration Tests**
Test cross-module functionality:

```typescript
describe('Document Lifecycle Integration', () => {
  it('should handle complete document workflow', async () => {
    // 1. Create document
    // 2. Upload file
    // 3. Sign document
    // 4. Verify document
    // 5. Create share link
  });
});
```

#### 3. **Performance Tests**
Test system performance and scalability:

```typescript
describe('Performance Tests', () => {
  it('should handle concurrent requests', async () => {
    // Test concurrent operations
  });

  it('should meet response time requirements', async () => {
    // Test response times
  });
});
```

### Test Data Management

#### Using Test Data Factory

```typescript
// Create basic account
const account = await testSuite.testDataFactory.createAccount();

// Create account with custom data
const customAccount = await testSuite.testDataFactory.createAccount({
  accountName: 'Custom Account',
  status: 'Active'
});

// Create user for account
const user = await testSuite.testDataFactory.createAccountUser(
  account._id,
  {
    name: 'Test User',
    emailAddress: 'test@example.com'
  }
);
```

#### Using Pre-defined Test Data

```typescript
import { TEST_ACCOUNTS, TEST_USERS } from '../fixtures/test-data';

// Use pre-defined test data
const { account, user, token } = await testSuite.createAndLoginUser(
  TEST_ACCOUNTS.BASIC,
  TEST_USERS.ADMIN
);
```

### Authentication Testing

#### Basic Authentication

```typescript
// Create and login user
const { account, user, token } = await testSuite.createAndLoginUser(
  TEST_ACCOUNTS.BASIC,
  TEST_USERS.BASIC
);

// Use token in requests
const response = await testSuite.getRequest()
  .get('/api/protected-endpoint')
  .set('Authorization', `Bearer ${token.accessToken}`)
  .expect(200);
```

#### Permission Testing

```typescript
// Test with different user roles
const adminUser = await testSuite.createAndLoginUser(
  TEST_ACCOUNTS.BASIC,
  TEST_USERS.ADMIN
);

const basicUser = await testSuite.createAndLoginUser(
  TEST_ACCOUNTS.BASIC,
  TEST_USERS.BASIC
);

// Test admin-only endpoint
await testSuite.getRequest()
  .get('/api/admin-only')
  .set('Authorization', `Bearer ${adminUser.token.accessToken}`)
  .expect(200);

// Test basic user access (should fail)
await testSuite.getRequest()
  .get('/api/admin-only')
  .set('Authorization', `Bearer ${basicUser.token.accessToken}`)
  .expect(403);
```

## 🧪 Test Categories

### 1. **Controller Tests**
Individual endpoint testing with comprehensive coverage:

- **CRUD Operations**: Create, Read, Update, Delete
- **Input Validation**: Required fields, format validation
- **Authentication**: JWT token validation
- **Authorization**: Permission-based access control
- **Error Handling**: Proper error responses
- **Edge Cases**: Boundary conditions

### 2. **Integration Tests**
Cross-module functionality testing:

- **Workflow Testing**: Complete business processes
- **Data Consistency**: Cross-module data integrity
- **API Integration**: External service integration
- **Event Handling**: Event-driven functionality

### 3. **Performance Tests**
System performance and scalability testing:

- **Load Testing**: High concurrency scenarios
- **Stress Testing**: System limits testing
- **Memory Testing**: Memory usage monitoring
- **Response Time**: API response time validation

### 4. **Security Tests**
Security and data protection testing:

- **Authentication**: Login/logout functionality
- **Authorization**: Permission enforcement
- **Data Isolation**: Account data separation
- **Input Validation**: Security vulnerability testing

## ⚡ Performance Testing

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '../utils/performance-monitor';

describe('Performance Tests', () => {
  let monitor: PerformanceMonitor;

  beforeAll(() => {
    monitor = PerformanceMonitor.getInstance();
  });

  it('should meet performance requirements', async () => {
    monitor.startTimer('api-request');
    
    const response = await testSuite.getRequest()
      .get('/api/endpoint')
      .expect(200);
    
    const duration = monitor.endTimer('api-request');
    
    expect(duration).toBeLessThan(1000); // 1 second
  });
});
```

### Performance Decorators

```typescript
import { timedTest, timedApiOperation } from '../utils/performance-monitor';

class MyTestClass {
  @timedTest
  async testMethod() {
    // Test implementation
  }

  @timedApiOperation('user-creation')
  async createUser() {
    // API operation
  }
}
```

### Performance Thresholds

Configure performance thresholds in `test/config/test-config.ts`:

```typescript
performance: {
  maxTestTime: 10000,        // 10 seconds
  maxMemoryUsage: 512 * 1024 * 1024, // 512MB
  maxApiResponseTime: 5000,  // 5 seconds
  maxDbOperationTime: 2000,  // 2 seconds
}
```

## 🔗 Integration Testing

### End-to-End Workflows

```typescript
describe('Complete Document Lifecycle', () => {
  it('should handle document from creation to verification', async () => {
    // 1. Setup
    const { account, user, token } = await testSuite.createAndLoginUser();
    
    // 2. Create document
    const document = await createDocument();
    
    // 3. Upload file
    await uploadFile(document);
    
    // 4. Sign document
    await signDocument(document);
    
    // 5. Verify document
    await verifyDocument(document);
    
    // 6. Create share link
    await createShareLink(document);
  });
});
```

### Cross-Module Testing

```typescript
describe('Cross-Module Data Consistency', () => {
  it('should maintain data consistency across modules', async () => {
    // Create document
    const document = await createDocument();
    
    // Create deal referencing document
    const deal = await createDeal(document);
    
    // Verify document is linked in deal
    expect(deal.documentIds).toContain(document._id);
    
    // Update document status
    await updateDocumentStatus(document, 'Published');
    
    // Verify status reflects in related entities
    const updatedDeal = await getDeal(deal._id);
    expect(updatedDeal.documentStatus).toBe('Published');
  });
});
```

## 🚀 CI/CD Integration

### GitHub Actions Workflow

The framework includes a comprehensive GitHub Actions workflow:

```yaml
name: E2E Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-group: [unit, integration, performance]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:e2e -- --testPathPattern="${{ matrix.test-group }}"
```

### Test Reports

The framework generates multiple report formats:

- **HTML Reports**: Visual test results
- **JSON Reports**: Machine-readable data
- **Markdown Reports**: Documentation-friendly format
- **JUnit XML**: CI/CD compatible format

### Coverage Reports

```bash
# Generate coverage report
npm run test:e2e -- --coverage

# View coverage report
open coverage-e2e/index.html
```

## 📚 Best Practices

### 1. **Test Organization**

- Group related tests in describe blocks
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern
- Keep tests independent and isolated

### 2. **Test Data Management**

- Use test data factories for consistency
- Clean up test data after each test
- Use meaningful test data
- Avoid hardcoded values

### 3. **Error Handling**

- Test both success and failure scenarios
- Validate error messages and status codes
- Test edge cases and boundary conditions
- Handle async operations properly

### 4. **Performance Considerations**

- Use appropriate timeouts
- Monitor memory usage
- Clean up resources properly
- Use parallel execution where possible

### 5. **Maintainability**

- Write reusable test utilities
- Document complex test scenarios
- Keep tests simple and focused
- Regular test maintenance

## 🔧 Troubleshooting

### Common Issues

#### 1. **Test Timeouts**

```typescript
// Increase timeout for specific tests
it('should handle long operation', async () => {
  // Test implementation
}, 60000); // 60 second timeout
```

#### 2. **Database Connection Issues**

```typescript
// Check MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test-db';
console.log('MongoDB URI:', mongoUri);
```

#### 3. **Authentication Failures**

```typescript
// Check JWT configuration
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

#### 4. **Memory Issues**

```typescript
// Monitor memory usage
const memoryUsage = process.memoryUsage();
console.log('Memory usage:', memoryUsage);

// Force garbage collection
if (global.gc) {
  global.gc();
}
```

### Debug Mode

```bash
# Run tests with debug output
npm run test:e2e -- --verbose

# Run specific test with debug
npm run test:e2e -- --testNamePattern="Specific Test" --verbose
```

### Test Isolation

```typescript
// Ensure proper cleanup
afterEach(async () => {
  await testSuite.cleanupDatabase();
  await testSuite.clearCache();
});
```

## 🔬 Advanced Topics

### Custom Test Utilities

```typescript
// Create custom test utility
export class CustomTestHelper {
  constructor(private testSuite: BaseE2ETest) {}

  async createComplexWorkflow() {
    // Complex test setup
  }

  async validateWorkflowResult(result: any) {
    // Complex validation
  }
}
```

### Test Configuration

```typescript
// Custom test configuration
import { getTestConfig } from '../config/test-config';

const config = getTestConfig();
config.timeouts.default = 60000; // 1 minute
config.performance.maxTestTime = 20000; // 20 seconds
```

### Mock Services

```typescript
// Mock external services
const mockExternalService = {
  processDocument: jest.fn().mockResolvedValue({ success: true }),
  sendNotification: jest.fn().mockResolvedValue({ sent: true })
};

// Use in tests
beforeAll(() => {
  jest.mock('../services/external-service', () => mockExternalService);
});
```

### Test Data Seeding

```typescript
// Seed test data
beforeAll(async () => {
  await testSuite.seedTestData({
    accounts: 5,
    users: 20,
    documents: 50
  });
});
```

## 📊 Monitoring and Reporting

### Performance Metrics

The framework tracks various performance metrics:

- Test execution times
- Memory usage patterns
- Database operation times
- API response times
- Error rates

### Test Reports

Generate comprehensive test reports:

```bash
# Generate performance report
node scripts/generate-performance-report.js

# Generate test summary
node scripts/generate-test-summary.js
```

### Coverage Analysis

Monitor test coverage:

```bash
# View coverage report
open coverage-e2e/index.html

# Check coverage thresholds
npm run test:e2e -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

## 🤝 Contributing

### Adding New Tests

1. Create test file in appropriate directory
2. Follow existing test patterns
3. Use provided utilities and helpers
4. Add comprehensive test coverage
5. Update documentation

### Test Data

1. Add new test data to `fixtures/test-data.ts`
2. Use descriptive names and realistic data
3. Ensure data relationships are correct
4. Update factory methods as needed

### Utilities

1. Add new utilities to `utils/` directory
2. Follow existing patterns and naming conventions
3. Add proper TypeScript types
4. Include comprehensive documentation

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

---

**Framework Version**: 1.0.0  
**Last Updated**: 2024  
**Maintainer**: Development Team
