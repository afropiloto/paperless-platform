import { registerAs } from '@nestjs/config';

export interface WorkerConfig {
  onboardingChecksConcurrency: number;
  emailProcessingConcurrency: number;
  dataExtractionConcurrency: number;
  documentSigningConcurrency: number;
  dealDeskConcurrency: number;
}

export interface DatabaseConfig {
  uri: string;
  rootUsername: string;
  rootPassword: string;
  database: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface ApiConfig {
  rateLimitTtl: number;
  rateLimitLimit: number;
  timeout: number;
}

export interface LoggingConfig {
  level: string;
  format: string;
  fileEnabled: boolean;
  filePath: string;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiration: string;
  mfaEnabled: boolean;
  mfaIssuer: string;
  mfaWindow: number;
  mfaBackupCodesCount: number;
  mfaAlgorithm: string;
  mfaDigits: number;
  mfaPeriod: number;
  mfaSecretLength: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecial: boolean;
  maxFailedLoginAttempts: number;
  accountLockoutDuration: number;
}

export interface ExternalServicesConfig {
  brevoApiKey: string;
  brevoSenderEmail: string;
  brevoSenderName: string;
}

export interface FileStorageConfig {
  path: string;
  maxFileSize: number;
  allowedFileTypes: string[];
}

export interface HealthCheckConfig {
  timeout: number;
  interval: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  port: number;
}

export interface DevelopmentConfig {
  debugMode: boolean;
  hotReload: boolean;
}

export interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  worker: WorkerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  api: ApiConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  externalServices: ExternalServicesConfig;
  fileStorage: FileStorageConfig;
  healthCheck: HealthCheckConfig;
  monitoring: MonitoringConfig;
  development: DevelopmentConfig;
}

export default registerAs('environment', (): EnvironmentConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';

  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '3001', 10),
    
    worker: {
      onboardingChecksConcurrency: parseInt(process.env.ONBOARDING_CHECKS_CONCURRENCY || '5', 10),
      emailProcessingConcurrency: parseInt(process.env.EMAIL_PROCESSING_CONCURRENCY || '3', 10),
      dataExtractionConcurrency: parseInt(process.env.DATA_EXTRACTION_CONCURRENCY || '2', 10),
      documentSigningConcurrency: parseInt(process.env.DOCUMENT_SIGNING_CONCURRENCY || '3', 10),
      dealDeskConcurrency: parseInt(process.env.DEAL_DESK_CONCURRENCY || '2', 10),
    },

    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tradedocs',
      rootUsername: process.env.MONGO_ROOT_USERNAME || 'admin',
      rootPassword: process.env.MONGO_ROOT_PASSWORD || 'password',
      database: process.env.MONGO_DATABASE || 'tradedocs',
    },

    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    },

    api: {
      rateLimitTtl: parseInt(process.env.API_RATE_LIMIT_TTL || '60', 10),
      rateLimitLimit: parseInt(process.env.API_RATE_LIMIT_LIMIT || '100', 10),
      timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    },

    logging: {
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      format: process.env.LOG_FORMAT || (isDevelopment ? 'pretty' : 'json'),
      fileEnabled: process.env.LOG_FILE_ENABLED === 'true' || isProduction,
      filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    },

    security: {
      jwtSecret: process.env.JWT_SECRET_KEY || 'default-jwt-secret',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret',
      refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
      mfaEnabled: process.env.MFA_ENABLED === 'true' || isProduction,
      mfaIssuer: process.env.MFA_ISSUER || 'Trade Documents Platform',
      mfaWindow: parseInt(process.env.MFA_WINDOW || '1', 10),
      mfaBackupCodesCount: parseInt(process.env.MFA_BACKUP_CODES_COUNT || '10', 10),
      mfaAlgorithm: process.env.MFA_ALGORITHM || 'sha1',
      mfaDigits: parseInt(process.env.MFA_DIGITS || '6', 10),
      mfaPeriod: parseInt(process.env.MFA_PERIOD || '30', 10),
      mfaSecretLength: parseInt(process.env.MFA_SECRET_LENGTH || '20', 10),
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
      passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true' || isProduction,
      passwordRequireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true' || isProduction,
      passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true' || isProduction,
      passwordRequireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL === 'true' || isProduction,
      maxFailedLoginAttempts: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5', 10),
      accountLockoutDuration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '15', 10),
    },

    externalServices: {
      brevoApiKey: process.env.BREVO_API_KEY || '',
      brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@yourdomain.com',
      brevoSenderName: process.env.BREVO_SENDER_NAME || 'Trade Documents Platform',
    },

    fileStorage: {
      path: process.env.FILE_STORAGE_PATH || './uploads',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
      allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png').split(','),
    },

    healthCheck: {
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
    },

    monitoring: {
      enabled: process.env.METRICS_ENABLED === 'true' || isProduction,
      port: parseInt(process.env.METRICS_PORT || '9090', 10),
    },

    development: {
      debugMode: process.env.DEBUG_MODE === 'true' || isDevelopment,
      hotReload: process.env.HOT_RELOAD === 'true' || isDevelopment,
    },
  };
});
