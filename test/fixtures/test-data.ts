/**
 * Test data fixtures for consistent testing
 */

import { AccountUserStatus, AuthMethod } from "src/account-users/schemas/account-user.schema";
import { AccountStatus } from "src/accounts/types/account.types";
import { TradeDocumentType, TradeDocumentStatus } from "src/types/trade-documents.types";
import { DealProcessingStatus } from "src/deal-desk/types/deal-desk.types";
import { ApplicationModule, ApplicationRole } from 'src/account-users/schemas';

export const TEST_ACCOUNTS = {
  BASIC: {
    accountName: 'Basic Test Account',
    contact: {
      emailAddress: 'basic@test.com',
      firstName: 'Basic',
      lastName: 'Test',
      name: 'Basic Test',
      position: 'Manager',
    },
    status: AccountStatus.ACTIVE,
  },
  INACTIVE: {
    accountName: 'Inactive Test Account',
    contact: {
      emailAddress: 'inactive@test.com',
      firstName: 'Inactive',
      lastName: 'Test',
      name: 'Inactive Test',
      position: 'Manager',
    },
    status: 'SUSPENDED',
  },
  PENDING: {
    accountName: 'Pending Test Account',
    contact: {
      emailAddress: 'pending@test.com',
      firstName: 'Pending',
      lastName: 'Test',
      name: 'Pending Test',
      position: 'Manager',
    },
    status: AccountStatus.UNDER_REVIEW,
  },
};

export const TEST_USERS = {
  BASIC: {
    name: 'Basic Test User',
    emailAddress: 'basic-user@test.com',
    walletAddress: '0x1234567890123456789012345678901234567890',
    status: AccountUserStatus.ACTIVE,
    permissions: [{ module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.AGENT }],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    mfaEnabled: false,
  },
  ADMIN: {
    name: 'Admin Test User',
    emailAddress: 'admin-user@test.com',
    walletAddress: '0x2345678901234567890123456789012345678901',
    status: AccountUserStatus.ACTIVE,
    permissions: [
      { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.MANAGER },
      { module: ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS, role: ApplicationRole.MANAGER },
      { module: ApplicationModule.PORTAL_ADMIN, role: ApplicationRole.AGENT },
    ],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    mfaEnabled: false,
  },
  WALLET_USER: {
    name: 'Wallet Test User',
    emailAddress: 'wallet-user@test.com',
    walletAddress: '0x3456789012345678901234567890123456789012',
    status: AccountUserStatus.ACTIVE,
    permissions: [{ module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.AGENT }],
    authMethod: AuthMethod.SIWE,
    mfaEnabled: false,
  },
  MFA_USER: {
    name: 'MFA Test User',
    emailAddress: 'mfa-user@test.com',
    walletAddress: '0x4567890123456789012345678901234567890123',
    status: AccountUserStatus.ACTIVE,
    permissions: [{ module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.AGENT }],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    mfaEnabled: true,
    mfaSecret: 'test-mfa-secret',
    backupCodes: ['123456', '789012', '345678', '901234', '567890'],
  },
  INACTIVE: {
    name: 'Inactive Test User',
    emailAddress: 'inactive-user@test.com',
    walletAddress: '0x5678901234567890123456789012345678901234',
    status: AccountUserStatus.SUSPENDED,
    permissions: [{ module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.AGENT }],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    mfaEnabled: false,
  },
};

export const TEST_TRADE_DOCUMENTS = {
  INVOICE: {
    title: 'Test Invoice',
    description: 'Test invoice document',
    documentType: TradeDocumentType.INVOICE,
    status: TradeDocumentStatus.IN_PROGRESS,
    metadata: {
      amount: 1000,
      currency: 'USD',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV-001',
    },
  },
  CONTRACT: {
    title: 'Test Contract',
    description: 'Test contract document',
    documentType: TradeDocumentType.OTHER,
    status: TradeDocumentStatus.IN_PROGRESS,
    metadata: {
      contractType: 'Service Agreement',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  },
  RECEIPT: {
    title: 'Test Receipt',
    description: 'Test receipt document',
    documentType: TradeDocumentType.OTHER,
    status: TradeDocumentStatus.IN_PROGRESS,
    metadata: {
      amount: 500,
      currency: 'USD',
      paymentMethod: 'Credit Card',
    },
  },
};

export const TEST_DEALS = {
  INVOICE_FINANCING: {
    dealName: 'Test Invoice Financing Deal',
    dealType: 'Invoice Financing',
    amount: 50000,
    currency: 'USD',
    status: DealProcessingStatus.NEW,
    description: 'Test invoice financing deal',
    metadata: {
      invoiceId: 'INV-001',
      customerId: 'CUST-001',
      riskLevel: 'Medium',
    },
  },
  ASSET_BASED_LENDING: {
    dealName: 'Test Asset Based Lending Deal',
    dealType: 'Asset Based Lending',
    amount: 100000,
    currency: 'USD',
    status: DealProcessingStatus.NEW,
    description: 'Test asset based lending deal',
    metadata: {
      collateralType: 'Inventory',
      collateralValue: 150000,
      ltv: 0.67,
    },
  },
};

export const TEST_ONBOARDING = {
  BASIC: {
    customerName: 'Test Customer',
    customerEmail: 'customer@test.com',
    status: 'Pending',
    documents: [],
    metadata: {
      industry: 'Technology',
      companySize: 'Medium',
      annualRevenue: 1000000,
    },
  },
  COMPLETED: {
    customerName: 'Completed Customer',
    customerEmail: 'completed@test.com',
    status: 'Completed',
    documents: ['doc1', 'doc2'],
    metadata: {
      industry: 'Finance',
      companySize: 'Large',
      annualRevenue: 5000000,
    },
  },
};

export const TEST_CHECKLISTS = {
  KYC: {
    checklistType: 'KYC',
    version: '1.0',
    items: [
      { id: '1', description: 'Identity verification', completed: false, required: true },
      { id: '2', description: 'Address verification', completed: false, required: true },
      { id: '3', description: 'Financial verification', completed: false, required: true },
    ],
  },
  AML: {
    checklistType: 'AML',
    version: '1.0',
    items: [
      { id: '1', description: 'PEP screening', completed: false, required: true },
      { id: '2', description: 'Sanctions screening', completed: false, required: true },
      { id: '3', description: 'Risk assessment', completed: false, required: true },
    ],
  },
};

export const TEST_NAMED_WALLETS = {
  ETHEREUM: {
    name: 'Test Ethereum Wallet',
    walletAddress: '0x1234567890123456789012345678901234567890',
    walletType: 'Ethereum',
    description: 'Test Ethereum wallet for testing',
  },
  POLYGON: {
    name: 'Test Polygon Wallet',
    walletAddress: '0x2345678901234567890123456789012345678901',
    walletType: 'Polygon',
    description: 'Test Polygon wallet for testing',
  },
};

export const TEST_FILES = {
  PDF: {
    fieldname: 'file',
    originalname: 'test-document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('PDF test content'),
    size: 15,
  },
  IMAGE: {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('JPEG test content'),
    size: 12,
  },
  TEXT: {
    fieldname: 'file',
    originalname: 'test-document.txt',
    encoding: '7bit',
    mimetype: 'text/plain',
    buffer: Buffer.from('Text test content'),
    size: 16,
  },
};

export const TEST_API_KEYS = {
  VALID: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e',
  INVALID: 'invalid-api-key',
  EXPIRED: 'expired-api-key',
};

export const TEST_WALLET_ADDRESSES = {
  VALID: '0x1234567890123456789012345678901234567890',
  INVALID: '0xinvalid',
  EMPTY: '',
};

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

export const TEST_PERMISSIONS = {
  DEAL_DESK_AGENT: { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.AGENT },
  DEAL_DESK_ADMIN: { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.MANAGER },
  TRADE_DOCUMENTS_VIEWER: { module: ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS, role: ApplicationRole.AGENT },
  TRADE_DOCUMENTS_EDITOR: { module: ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS, role: ApplicationRole.SUPERVISOR },
  ANALYTICS_VIEWER: { module: ApplicationModule.PORTAL_ADMIN, role: ApplicationRole.AGENT },
  USER_MANAGEMENT_ADMIN: { module: ApplicationModule.PORTAL_ADMIN, role: ApplicationRole.MANAGER },
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
