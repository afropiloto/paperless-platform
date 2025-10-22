import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Account, AccountSchema } from '../src/accounts/schemas/account.schema';
import { AccountUser, AccountUserSchema, AccountUserStatus, AuthMethod } from '../src/account-users/schemas/account-user.schema';
import { ApplicationModule, ApplicationRole } from '../src/account-users/schemas/application-permissions.schema';
import { AccountStatus } from '../src/accounts/types/account.types';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI as string;

// Default seed data for Account and AccountUser
const DEFAULT_ACCOUNT_DATA = {
  accountName: 'Paperles',
  walletAddress: '0xB320cf3e10FdD73fbCc81f225ACb71faE0342aDf', // Placeholder wallet address
  company: {
    name: 'Paperless',
    address: {
      street: 'Keemia 4, Fu District',
      city: 'Tallinn',
      state: 'Harju County 10616',
      country: 'Estonia'
    },
    website: 'https://www.paperless.money'
  },
  contact: {
    name: 'Lee  Tarone',
    position: 'CEO',
    emailAddress: 'lee@paperless.money',
    phone: '+44 20 1234 5678'
  },
  applicationModules: [
    ApplicationModule.PORTAL_DEAL_DESK,
    ApplicationModule.PORTAL_ONBOARDING_DESK,
    ApplicationModule.PORTAL_ADMIN,
    ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS,
    ApplicationModule.PAIPERLESS_TRADE_FINANCE,
    ApplicationModule.PAIPERLESS_ADMIN
  ],
  status: AccountStatus.ACTIVE
};

const DEFAULT_ACCOUNT_USERS_DATA = [
  {
    name: 'Lee Tarone',
    emailAddress: 'lee@paperless.money',
    walletAddress: '0xB320cf3e10FdD73fbCc81f225ACb71faE0342aDf',
    status: AccountUserStatus.ACTIVE,
    permissions: [
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PORTAL_ONBOARDING_DESK, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PORTAL_ONBOARDING_DESK, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PORTAL_ADMIN, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PAIPERLESS_TRADE_FINANCE, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PAIPERLESS_TRADE_FINANCE, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PAIPERLESS_ADMIN, role: ApplicationRole.MANAGER }
    ],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    mfaEnabled: false,
    mfaSetupRequired: false,
    passwordChanged: true,
    passwordResetRequired: false,
    failedLoginAttempts: 0
  },
  {
    name: 'Bill Matthews',
    emailAddress: 'bill@paperless.money',
    walletAddress: '0xB320cf3e10FdD73fbCc81f225ACb71faE0342aDf',
    status: AccountUserStatus.ACTIVE,
    permissions: [
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PORTAL_DEAL_DESK, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PORTAL_ONBOARDING_DESK, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PORTAL_ONBOARDING_DESK, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PORTAL_ADMIN, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS, role: ApplicationRole.AGENT },
        { module: ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PAIPERLESS_TRADE_FINANCE, role: ApplicationRole.SUPERVISOR },
        { module: ApplicationModule.PAIPERLESS_TRADE_FINANCE, role: ApplicationRole.MANAGER },
        { module: ApplicationModule.PAIPERLESS_ADMIN, role: ApplicationRole.MANAGER }
    ],
    authMethod: AuthMethod.EMAIL_PASSWORD,
    mfaEnabled: false,
    mfaSetupRequired: false,
    passwordChanged: true,
    passwordResetRequired: false,
    failedLoginAttempts: 0
  }
];

async function run() {
  if (!MONGO_URI) {
    console.error('MONGODB_URI is not set in environment');
    process.exit(1);
  }

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
        // Create the account user
        const accountUserData = {
          ...userData,
          accountId: accountId
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
