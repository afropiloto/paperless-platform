# Controller Tests

This directory contains comprehensive REST API tests for all controller endpoints in the application.

## Structure

- `auth/` - Authentication and user management tests
- `accounts/` - Account management tests
- `documents/` - Document-related tests
- `finance/` - Finance and deal processing tests
- `management/` - Management and utility tests
- `integration/` - End-to-end integration tests

## Test Organization

Each controller has its own test file following the naming convention:
- `{controller-name}.e2e-spec.ts`

## Test Patterns

All tests follow these patterns:
1. **Setup** - Create necessary test data
2. **Execute** - Make API requests
3. **Assert** - Verify responses and side effects
4. **Cleanup** - Remove test data

## Common Test Scenarios

- **Happy Path** - Valid requests with expected responses
- **Validation** - Invalid input handling
- **Authentication** - JWT token validation
- **Authorization** - Permission-based access control
- **Error Handling** - Proper error responses
- **Edge Cases** - Boundary conditions and special cases

## Running Tests

```bash
# Run all controller tests
npm run test:e2e

# Run specific controller tests
npm run test:e2e -- --testNamePattern="AuthController"

# Run with coverage
npm run test:e2e -- --coverage
```

## Test Data

Test data is managed through:
- `test/fixtures/test-data.ts` - Static test data
- `test/utils/test-data-factory.ts` - Dynamic test data generation
- `test/utils/database-helper.ts` - Database cleanup utilities

## Best Practices

1. **Isolation** - Each test should be independent
2. **Cleanup** - Always clean up test data
3. **Descriptive Names** - Use clear, descriptive test names
4. **Single Responsibility** - One test per scenario
5. **Error Testing** - Test both success and failure cases
6. **Performance** - Consider test execution time
7. **Maintainability** - Use helper functions for common operations
