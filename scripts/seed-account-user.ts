import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Account, AccountSchema } from '../src/accounts/schemas/account.schema';
import { AccountUser, AccountUserSchema, AccountUserStatus, AuthMethod } from '../src/account-users/schemas/account-user.schema';
import { ApplicationModule, ApplicationRole } from '../src/account-users/schemas/application-permissions.schema';
import { AccountStatus } from '../src/accounts/types/account.types';
import { PasswordService } from '../src/auth/services/password.service';
import { ConfigService } from '@nestjs/config';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI as string;

// Initialize PasswordService with a mock ConfigService
const mockConfigService = {
  get: (key: string) => {
    // Return default values for password policy
    const defaults: Record<string, any> = {
      'auth.password.minLength': 8,
      'auth.password.requireUppercase': true,
      'auth.password.requireLowercase': true,
      'auth.password.requireNumbers': true,
      'auth.password.requireSpecialChars': true,
    };
    return defaults[key];
  }
} as ConfigService;

const passwordService = new PasswordService(mockConfigService);

// Get wallet address from command line arguments
const WALLET_ADDRESS = process.argv[2];

if (!WALLET_ADDRESS) {
  console.error('Error: Wallet address is required as a command line argument');
  console.error('Usage: npm run script:seed-account-user <wallet_address>');
  console.error('Example: npm run script:seed-account-user 0xB320cf3e10FdD73fbCc81f225ACb71faE0342aDf');
  process.exit(1);
}

// Validate wallet address format (basic Ethereum address validation)
if (!WALLET_ADDRESS.match(/^0x[a-fA-F0-9]{40}$/)) {
  console.error('Error: Invalid wallet address format. Must be a valid Ethereum address (0x followed by 40 hex characters)');
  console.error('Provided address:', WALLET_ADDRESS);
  process.exit(1);
}

// Default seed data for Account and AccountUser
const DEFAULT_ACCOUNT_DATA = {
  accountName: 'Paperless',
  walletAddress: WALLET_ADDRESS,
  company: {
    name: 'Paperless',
    address: {
      street: 'Keemia 4, Fu District',
      city: 'Tallinn',
      state: 'Harju County 10616',
      country: 'Estonia'
    },
    website: 'https://www.paperlesslabs.xyz'
  },
  contact: {
    name: 'Lee  Tarone',
    position: 'CEO',
    emailAddress: 'lee@paperlesslabs.xyz',
    phone: '+44 20 1234 5678'
  },
  applicationModules: [
    ApplicationModule.PORTAL_DEAL_DESK,
    ApplicationModule.PORTAL_ONBOARDING_DESK,
    ApplicationModule.PORTAL_ADMIN,
    ApplicationModule.PAPERLESS_TRADE_DOCUMENTS,
    ApplicationModule.PAPERLESS_TRADE_FINANCE,
    ApplicationModule.PAPERLESS_ADMIN
  ],
  status: AccountStatus.ACTIVE
};

const DEFAULT_ACCOUNT_USERS_DATA = [
  {
    name: 'Lee Tarone',
    emailAddress: 'lee@paperlesslabs.xyz',
    walletAddress: WALLET_ADDRESS,
    status: AccountUserStatus.ACTIVE,
    permissions: [
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PORTAL_ONBOARDING_DESK, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PORTAL_ONBOARDING_DESK, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PORTAL_ADMIN, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PAPERLESS_TRADE_DOCUMENTS, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PAPERLESS_TRADE_DOCUMENTS, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PAPERLESS_TRADE_FINANCE, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PAPERLESS_TRADE_FINANCE, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PAPERLESS_ADMIN, role: ApplicationRole.MANAGER }
    ],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    mfaEnabled: false,
    mfaSetupRequired: false
  },
  {
    name: 'Bill Matthews',
    emailAddress: 'bill@paperlesslabs.xyz',
    walletAddress: WALLET_ADDRESS,
    status: AccountUserStatus.ACTIVE,
    permissions: [
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PORTAL_ONBOARDING_DESK, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PORTAL_ONBOARDING_DESK, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PORTAL_ADMIN, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PAPERLESS_TRADE_DOCUMENTS, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PAPERLESS_TRADE_DOCUMENTS, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PAPERLESS_TRADE_FINANCE, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PAPERLESS_TRADE_FINANCE, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PAPERLESS_ADMIN, role: ApplicationRole.MANAGER }
    ],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    mfaEnabled: false,
    mfaSetupRequired: false
  }
];

async function run() {
  if (!MONGO_URI) {
    console.error('MONGODB_URI is not set in environment');
    process.exit(1);
  }

  console.log(`Using wallet address: ${WALLET_ADDRESS}`);
  await mongoose.connect(MONGO_URI);
  
  const AccountModel = mongoose.model(Account.name, AccountSchema);
  const AccountUserModel = mongoose.model(AccountUser.name, AccountUserSchema);

  try {
    // Check if default account already exists
    const existingAccount = await AccountModel.findOne({ 
      accountName: DEFAULT_ACCOUNT_DATA.accountName 
    });

    let accountId: mongoose.Types.ObjectId;

    if (existingAccount) {
      console.log(`Account '${DEFAULT_ACCOUNT_DATA.accountName}' already exists`);
      accountId = existingAccount._id;
    } else {
      // Create the default account
      const account = new AccountModel(DEFAULT_ACCOUNT_DATA);
      const savedAccount = await account.save();
      accountId = savedAccount._id;
      console.log(`Created account: ${DEFAULT_ACCOUNT_DATA.accountName} with ID: ${accountId}`);
    }

    // Process multiple account users
    for (const userData of DEFAULT_ACCOUNT_USERS_DATA) {
      // Check if account user already exists
      const existingUser = await AccountUserModel.findOne({ 
        emailAddress: userData.emailAddress 
      });

      if (existingUser) {
        console.log(`Account user '${userData.emailAddress}' already exists`);
      } else {
        // Generate secure password for the user
        const generatedPassword = passwordService.generateSecurePassword(16);
        console.log(`Generated password for ${userData.emailAddress} (${userData.name}): ${generatedPassword}`);
        
        // Hash the password
        const passwordHash = await passwordService.hashPassword(generatedPassword);
        
        // Create the account user with hashed password
        const accountUserData = {
          ...userData,
          accountId: accountId,
          passwordHash: passwordHash,
          passwordChanged: false, // User must change password on first login
          passwordResetRequired: false,
          failedLoginAttempts: 0
        };
        
        const accountUser = new AccountUserModel(accountUserData);
        await accountUser.save();
        console.log(`Created account user: ${userData.emailAddress} (${userData.name}) for account: ${DEFAULT_ACCOUNT_DATA.accountName}`);
      }
    }

    console.log(`Account and ${DEFAULT_ACCOUNT_USERS_DATA.length} AccountUser(s) seeding completed successfully`);
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error('Error seeding account and account user:', err);
  process.exit(1);
});
