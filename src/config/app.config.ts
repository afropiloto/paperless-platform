
export default () => ({
  app: {
    name: process.env.APP_NAME || 'Paperless Trade Documents Platform',
    url: process.env.APP_DOMAIN || 'https://ai.paperless.com',
    supportEmail: process.env.APP_SUPPORT_EMAIL || 'support@paperless.com',
  },
  server: {
    port: process.env.PORT || 3002,
  },
  database: {
    connectionString: process.env.MONGODB_URI,
  },
  jwt: {
    secretKey: process.env.JWT_SECRET_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },
  auth: {
    mfa: {
      enabled: process.env.MFA_ENABLED === 'true',
      issuer: process.env.MFA_ISSUER || 'Trade Documents Platform',
      window: parseInt(process.env.MFA_WINDOW) || 1,
      backupCodesCount: parseInt(process.env.MFA_BACKUP_CODES_COUNT) || 10,
      // New speakeasy-specific configuration options
      algorithm: process.env.MFA_ALGORITHM || 'sha1', // sha1, sha256, sha512
      digits: parseInt(process.env.MFA_DIGITS) || 6, // 6 or 8 digits
      period: parseInt(process.env.MFA_PERIOD) || 30, // Time step in seconds
      secretLength: parseInt(process.env.MFA_SECRET_LENGTH) || 20, // Secret length in bytes
    },
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
    },
    accountLockout: {
      maxFailedAttempts: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5,
      lockoutDuration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION) || 15, // minutes
    },
    passwordReset: {
      expiryMinutes: parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES) || 30,
    },
  },
  tenant: {
    financeModule: false,
    provider: {
      network: process.env.CHAIN,
      chainId: process.env.CHAIN_ID
    },
    tokenRegistryAddress:process.env.TOKEN_REGISTRY_ADDRESS,
    documentStoreAddress:process.env.DOCUMENT_STORE_ADDRESS,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    dataExtractionQueueName: process.env.DATA_EXTRACTION_QUEUE_NAME || "data-extraction",
  },
  environment: process.env.NODE_ENV || 'development',
});
