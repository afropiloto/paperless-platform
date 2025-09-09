# Test Data Migration Guide

## Overview

This guide explains the migration from the old string-based test data to the new type-safe DTO-based test data.

## Benefits of Typed Test Data

1. **Compile-time Type Safety**: TypeScript will catch type mismatches at compile time
2. **Better IDE Support**: Auto-completion and IntelliSense for all properties
3. **Maintainability**: Changes to DTOs will automatically update test data
4. **Consistency**: Test data matches exactly what the API expects
5. **Documentation**: DTOs serve as living documentation of the API structure

## Migration Steps

### 1. Update Imports

**Before:**
```typescript
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/test-data';
```

**After:**
```typescript
import { TEST_ACCOUNTS, TEST_USERS } from '../../fixtures/typed-test-data';
```

### 2. Update Test Data Usage

The new typed test data uses actual DTOs, so the structure is more explicit:

**Before:**
```typescript
const { account, user, token } = await testSuite.createAndLoginUser(
  TEST_ACCOUNTS.BASIC,
  TEST_USERS.ADMIN
);
```

**After:**
```typescript
const { account, user, token } = await testSuite.createAndLoginUser(
  TEST_ACCOUNTS.BASIC,
  TEST_USERS.ADMIN
);
```

The usage remains the same, but now TypeScript will validate the types.

### 3. Custom Test Data

When creating custom test data, use the helper functions:

```typescript
import { 
  createCompanyDetails, 
  createContactDetails, 
  createUserPermission 
} from '../../fixtures/typed-test-data';

const customAccount = {
  accountName: 'Custom Account',
  walletAddress: '0x...',
  company: createCompanyDetails({ name: 'Custom Company' }),
  contact: createContactDetails({ emailAddress: 'custom@test.com' }),
  applicationModules: [ApplicationModule.PORTAL_DEAL_DESK],
  status: AccountStatus.ACTIVE,
};
```

### 4. Available Helper Functions

- `createCompanyAddress(overrides?)` - Creates company address DTO
- `createCompanyDetails(overrides?)` - Creates company details DTO
- `createContactDetails(overrides?)` - Creates contact details DTO
- `createUserPermission(module, role)` - Creates user permission DTO
- `createBillableItem(overrides?)` - Creates billable item DTO
- `createInvoicePartyDetails(overrides?)` - Creates invoice party details DTO
- `createInvoiceContent(overrides?)` - Creates invoice content DTO

## Type Safety Benefits

### Before (String-based)
```typescript
// No type checking - could use invalid values
const account = {
  status: 'InvalidStatus', // ❌ No error at compile time
  contact: {
    emailAddress: 'invalid-email', // ❌ No validation
    // Missing required fields - no error
  }
};
```

### After (DTO-based)
```typescript
// Full type checking and validation
const account: Partial<AccountCreationDto> = {
  status: AccountStatus.ACTIVE, // ✅ Type-safe enum
  contact: createContactDetails({
    emailAddress: 'valid@email.com', // ✅ Email validation
    name: 'Required Field', // ✅ All required fields enforced
    position: 'Manager'
  })
};
```

## Migration Checklist

- [ ] Update all test file imports to use `typed-test-data`
- [ ] Replace any hardcoded test data with helper functions
- [ ] Update custom test data creation to use DTOs
- [ ] Remove old `test-data.ts` file after migration is complete
- [ ] Update documentation to reference new patterns

## Common Patterns

### Creating Test Users
```typescript
const user = {
  ...TEST_USERS.BASIC,
  emailAddress: 'custom@test.com',
  permissions: [
    createUserPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.AGENT),
    createUserPermission(ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS, ApplicationRole.SUPERVISOR)
  ]
};
```

### Creating Test Accounts
```typescript
const account = {
  ...TEST_ACCOUNTS.BASIC,
  accountName: 'Custom Account Name',
  company: createCompanyDetails({
    name: 'Custom Company',
    website: 'https://custom.com'
  })
};
```

### Creating Test Documents
```typescript
const document = {
  ...TEST_TRADE_DOCUMENTS.INVOICE,
  documentReference: 'CUSTOM-001',
  documentContent: createInvoiceContent({
    invoiceNumber: 'CUSTOM-INV-001',
    invoiceTotal: 5000
  })
};
```

This approach ensures that all test data is type-safe, maintainable, and consistent with the actual API contracts.
