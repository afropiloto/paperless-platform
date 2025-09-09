/**
 * Type-safe test data fixtures using actual DTOs
 * This ensures compile-time type checking and better maintainability
 */

import { AccountCreationDto, CompanyDetailsDto, CompanyAddressDto, CompanyContactDetailsDto } from 'src/accounts/dtos/accounts.dto';
import { CreateAccountUserDto, UserPermissionDto } from 'src/account-users/dtos/account-user.dto';
import { CreateTradeDocumentFromFileDto, UpsertTradeDocumentDto, InvoiceContentDto, InvoicePartyDetailsDto, BillableItemDto } from 'src/trade-documents/dtos/trade-document.dto';
import { CreateDealProcessingDto } from 'src/deal-desk/dto/create-deal-processing.dto';
import { AccountUserStatus, AuthMethod, ApplicationModule, ApplicationRole } from 'src/account-users/schemas/account-user.schema';
import { AccountStatus } from 'src/accounts/types/account.types';
import { TradeDocumentType, TradeDocumentStatus } from 'src/types/trade-documents.types';
import { DealProcessingStatus } from 'src/deal-desk/types/deal-desk.types';

// Helper function to create company address
function createCompanyAddress(overrides: Partial<CompanyAddressDto> = {}): CompanyAddressDto {
  return {
    street: '123 Business Street',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'United States',
    ...overrides,
  };
}

// Helper function to create company details
function createCompanyDetails(overrides: Partial<CompanyDetailsDto> = {}): CompanyDetailsDto {
  return {
    name: 'Test Company Ltd',
    address: createCompanyAddress(),
    website: 'https://testcompany.com',
    ...overrides,
  };
}

// Helper function to create contact details
function createContactDetails(overrides: Partial<CompanyContactDetailsDto> = {}): CompanyContactDetailsDto {
  return {
    name: 'Test Contact',
    position: 'Manager',
    emailAddress: 'contact@test.com',
    phone: '+1-555-0123',
    ...overrides,
  };
}

// Helper function to create user permissions
function createUserPermission(module: ApplicationModule, role: ApplicationRole): UserPermissionDto {
  return {
    module: module as any, // Type assertion needed due to string vs enum mismatch
    role: role as any,
  };
}

// Helper function to create billable item
function createBillableItem(overrides: Partial<BillableItemDto> = {}): BillableItemDto {
  return {
    description: 'Test Item',
    quantity: 1,
    unitPrice: 100,
    amount: 100,
    ...overrides,
  };
}

// Helper function to create invoice party details
function createInvoicePartyDetails(overrides: Partial<InvoicePartyDetailsDto> = {}): InvoicePartyDetailsDto {
  return {
    companyName: 'Test Company',
    streetAddress: '123 Main St',
    city: 'New York',
    postalCode: '10001',
    contactNumber: '+1-555-0123',
    contactEmail: 'contact@test.com',
    ...overrides,
  };
}

// Helper function to create invoice content
function createInvoiceContent(overrides: Partial<InvoiceContentDto> = {}): InvoiceContentDto {
  return {
    invoiceNumber: 'INV-001',
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    terms: 'Net 30',
    currencyCode: 'USD',
    invoiceTotal: 1000,
    billFrom: createInvoicePartyDetails(),
    billTo: createInvoicePartyDetails({ companyName: 'Customer Company' }),
    billableItems: [createBillableItem()],
    ...overrides,
  };
}

export const TEST_ACCOUNTS: Record<string, Partial<AccountCreationDto>> = {
  BASIC: {
    accountName: 'Basic Test Account',
    walletAddress: '0x1234567890123456789012345678901234567890',
    company: createCompanyDetails(),
    contact: createContactDetails(),
    applicationModules: [ApplicationModule.PORTAL_DEAL_DESK],
    status: AccountStatus.ACTIVE,
  },
  INACTIVE: {
    accountName: 'Inactive Test Account',
    walletAddress: '0x2345678901234567890123456789012345678901',
    company: createCompanyDetails({ name: 'Inactive Company Ltd' }),
    contact: createContactDetails({ emailAddress: 'inactive@test.com' }),
    applicationModules: [ApplicationModule.PORTAL_DEAL_DESK],
    status: AccountStatus.SUSPENDED,
  },
  PENDING: {
    accountName: 'Pending Test Account',
    walletAddress: '0x3456789012345678901234567890123456789012',
    company: createCompanyDetails({ name: 'Pending Company Ltd' }),
    contact: createContactDetails({ emailAddress: 'pending@test.com' }),
    applicationModules: [ApplicationModule.PORTAL_DEAL_DESK],
    status: AccountStatus.UNDER_REVIEW,
  },
};

export const TEST_USERS: Record<string, Partial<CreateAccountUserDto>> = {
  BASIC: {
    name: 'Basic Test User',
    emailAddress: 'basic-user@test.com',
    walletAddress: '0x1234567890123456789012345678901234567890',
    status: AccountUserStatus.ACTIVE,
    permissions: [createUserPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.AGENT)],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    enableMfa: false,
    sendInvitation: false,
  },
  ADMIN: {
    name: 'Admin Test User',
    emailAddress: 'admin-user@test.com',
    walletAddress: '0x2345678901234567890123456789012345678901',
    status: AccountUserStatus.ACTIVE,
    permissions: [
      createUserPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.MANAGER),
      createUserPermission(ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS, ApplicationRole.MANAGER),
      createUserPermission(ApplicationModule.PORTAL_ADMIN, ApplicationRole.AGENT),
    ],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    enableMfa: false,
    sendInvitation: false,
  },
  WALLET_USER: {
    name: 'Wallet Test User',
    emailAddress: 'wallet-user@test.com',
    walletAddress: '0x3456789012345678901234567890123456789012',
    status: AccountUserStatus.ACTIVE,
    permissions: [createUserPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.AGENT)],
    authMethod: AuthMethod.SIWE,
    enableMfa: false,
    sendInvitation: false,
  },
  MFA_USER: {
    name: 'MFA Test User',
    emailAddress: 'mfa-user@test.com',
    walletAddress: '0x4567890123456789012345678901234567890123',
    status: AccountUserStatus.ACTIVE,
    permissions: [createUserPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.AGENT)],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    enableMfa: true,
    sendInvitation: false,
  },
  INACTIVE: {
    name: 'Inactive Test User',
    emailAddress: 'inactive-user@test.com',
    walletAddress: '0x5678901234567890123456789012345678901234',
    status: AccountUserStatus.SUSPENDED,
    permissions: [createUserPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.AGENT)],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    enableMfa: false,
    sendInvitation: false,
  },
};

export const TEST_TRADE_DOCUMENTS: Record<string, Partial<UpsertTradeDocumentDto>> = {
  INVOICE: {
    documentReference: 'INV-001',
    documentType: TradeDocumentType.INVOICE,
    documentContent: createInvoiceContent(),
  },
  CONTRACT: {
    documentReference: 'CONTRACT-001',
    documentType: TradeDocumentType.OTHER,
    documentContent: {
      title: 'Test Contract',
      description: 'Test contract document',
      issueDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  RECEIPT: {
    documentReference: 'RECEIPT-001',
    documentType: TradeDocumentType.OTHER,
    documentContent: {
      title: 'Test Receipt',
      description: 'Test receipt document',
      issueDate: new Date().toISOString(),
    },
  },
};

export const TEST_DEALS: Record<string, Partial<CreateDealProcessingDto>> = {
  INVOICE_FINANCING: {
    dealId: '507f1f77bcf86cd799439011',
    accountId: '507f1f77bcf86cd799439012',
  },
  ASSET_BASED_LENDING: {
    dealId: '507f1f77bcf86cd799439013',
    accountId: '507f1f77bcf86cd799439014',
  },
};

export const TEST_PERMISSIONS: Record<string, UserPermissionDto> = {
  DEAL_DESK_AGENT: createUserPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.AGENT),
  DEAL_DESK_ADMIN: createUserPermission(ApplicationModule.PORTAL_DEAL_DESK, ApplicationRole.MANAGER),
  TRADE_DOCUMENTS_VIEWER: createUserPermission(ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS, ApplicationRole.AGENT),
  TRADE_DOCUMENTS_EDITOR: createUserPermission(ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS, ApplicationRole.SUPERVISOR),
  ANALYTICS_VIEWER: createUserPermission(ApplicationModule.PORTAL_ADMIN, ApplicationRole.AGENT),
  USER_MANAGEMENT_ADMIN: createUserPermission(ApplicationModule.PORTAL_ADMIN, ApplicationRole.MANAGER),
};

// Additional test data constants
export const TEST_EMAILS = {
  VALID: 'test@example.com',
  INVALID: 'invalid-email',
  EMPTY: '',
  LONG: 'a'.repeat(100) + '@example.com',
};

export const TEST_PASSWORDS = {
  VALID: 'ValidPassword123!',
  WEAK: 'weak',
  NO_UPPERCASE: 'validpassword123!',
  NO_LOWERCASE: 'VALIDPASSWORD123!',
  NO_NUMBERS: 'ValidPassword!',
  NO_SPECIAL: 'ValidPassword123',
  TOO_SHORT: 'Val1!',
  TOO_LONG: 'ValidPassword123!'.repeat(10),
};

export const TEST_WALLET_ADDRESSES = {
  VALID: '0x1234567890123456789012345678901234567890',
  INVALID: '0xinvalid',
  EMPTY: '',
};

export const TEST_API_KEYS = {
  VALID: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e',
  INVALID: 'invalid-api-key',
  EXPIRED: 'expired-api-key',
};

export const TEST_MFA_CODES = {
  VALID: '123456',
  INVALID: '000000',
  EXPIRED: '999999',
};

export const TEST_JWT_TOKENS = {
  VALID: 'valid-jwt-token',
  INVALID: 'invalid-jwt-token',
  EXPIRED: 'expired-jwt-token',
  MALFORMED: 'malformed-jwt-token',
};

export const TEST_PAGINATION = {
  VALID: { page: 1, limit: 10 },
  LARGE_LIMIT: { page: 1, limit: 1000 },
  INVALID_PAGE: { page: -1, limit: 10 },
  INVALID_LIMIT: { page: 1, limit: 0 },
  ZERO_LIMIT: { page: 1, limit: 0 },
  NEGATIVE_PAGE: { page: -1, limit: 10 },
};

export const TEST_SORTING = {
  VALID_ASC: { sortBy: 'createdAt', sortOrder: 'asc' },
  VALID_DESC: { sortBy: 'createdAt', sortOrder: 'desc' },
  INVALID_FIELD: { sortBy: 'invalidField', sortOrder: 'asc' },
  INVALID_ORDER: { sortBy: 'createdAt', sortOrder: 'invalid' },
};

export const TEST_SEARCH = {
  VALID: 'test search term',
  EMPTY: '',
  SPECIAL_CHARS: 'test@#$%^&*()',
  LONG: 'a'.repeat(1000),
  NUMBERS: '123456',
  MIXED: 'test123@#$%',
};
