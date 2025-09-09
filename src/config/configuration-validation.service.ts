import { Injectable, Logger } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';

@Injectable()
export class ConfigurationValidationService {
  private readonly logger = new Logger(ConfigurationValidationService.name);

  constructor(private readonly configurationService: ConfigurationService) {}

  validateConfiguration(): void {
    this.logger.log('Starting configuration validation...');

    try {
      this.validateRequiredEnvironmentVariables();
      this.validateDatabaseConfiguration();
      this.validateRedisConfiguration();
      this.validateSecurityConfiguration();
      this.validateWorkerConfiguration();
      this.validateExternalServicesConfiguration();
      this.validateFileStorageConfiguration();

      this.logger.log('✅ Configuration validation completed successfully');
    } catch (error) {
      this.logger.error('❌ Configuration validation failed:', error.message);
      throw error;
    }
  }

  private validateRequiredEnvironmentVariables(): void {
    const requiredVars = [
      'NODE_ENV',
      'MONGODB_URI',
      'REDIS_HOST',
      'JWT_SECRET_KEY',
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    this.logger.log('✅ Required environment variables validation passed');
  }

  private validateDatabaseConfiguration(): void {
    const { database } = this.configurationService.environment;
    
    if (!database.uri) {
      throw new Error('MONGODB_URI is required');
    }

    if (!database.uri.includes('mongodb://') && !database.uri.includes('mongodb+srv://')) {
      throw new Error('MONGODB_URI must be a valid MongoDB connection string');
    }

    this.logger.log('✅ Database configuration validation passed');
  }

  private validateRedisConfiguration(): void {
    const { redis } = this.configurationService.environment;
    
    if (!redis.host) {
      throw new Error('REDIS_HOST is required');
    }

    if (redis.port < 1 || redis.port > 65535) {
      throw new Error('REDIS_PORT must be between 1 and 65535');
    }

    this.logger.log('✅ Redis configuration validation passed');
  }

  private validateSecurityConfiguration(): void {
    const { security } = this.configurationService.environment;
    
    if (!security.jwtSecret || security.jwtSecret === 'default-jwt-secret') {
      this.logger.warn('⚠️  JWT_SECRET_KEY is using default value - this is not secure for production');
    }

    if (!security.refreshTokenSecret || security.refreshTokenSecret === 'default-refresh-secret') {
      this.logger.warn('⚠️  REFRESH_TOKEN_SECRET is using default value - this is not secure for production');
    }

    if (security.passwordMinLength < 8) {
      this.logger.warn('⚠️  PASSWORD_MIN_LENGTH is less than 8 - consider increasing for better security');
    }

    this.logger.log('✅ Security configuration validation passed');
  }

  private validateWorkerConfiguration(): void {
    const { worker } = this.configurationService.environment;
    
    const concurrencyValues = [
      worker.onboardingChecksConcurrency,
      worker.emailProcessingConcurrency,
      worker.dataExtractionConcurrency,
      worker.documentSigningConcurrency,
      worker.dealDeskConcurrency,
    ];

    const invalidConcurrency = concurrencyValues.filter(value => value < 1 || value > 100);
    
    if (invalidConcurrency.length > 0) {
      throw new Error('Worker concurrency values must be between 1 and 100');
    }

    const totalConcurrency = concurrencyValues.reduce((sum, value) => sum + value, 0);
    
    if (totalConcurrency > 50) {
      this.logger.warn(`⚠️  Total worker concurrency is ${totalConcurrency} - consider monitoring resource usage`);
    }

    this.logger.log('✅ Worker configuration validation passed');
  }

  private validateExternalServicesConfiguration(): void {
    const { externalServices } = this.configurationService.environment;
    
    if (!externalServices.brevoApiKey) {
      this.logger.warn('⚠️  BREVO_API_KEY is not set - email functionality may not work');
    }

    if (!externalServices.brevoSenderEmail) {
      this.logger.warn('⚠️  BREVO_SENDER_EMAIL is not set - using default value');
    }

    if (!externalServices.brevoSenderName) {
      this.logger.warn('⚠️  BREVO_SENDER_NAME is not set - using default value');
    }

    this.logger.log('✅ External services configuration validation passed');
  }

  private validateFileStorageConfiguration(): void {
    const { fileStorage } = this.configurationService.environment;
    
    if (fileStorage.maxFileSize < 1024) {
      this.logger.warn('⚠️  MAX_FILE_SIZE is very small - consider increasing for better user experience');
    }

    if (fileStorage.allowedFileTypes.length === 0) {
      this.logger.warn('⚠️  No allowed file types configured - file uploads may be restricted');
    }

    this.logger.log('✅ File storage configuration validation passed');
  }

  logConfigurationSummary(): void {
    const config = this.configurationService.environment;
    
    this.logger.log('📋 Configuration Summary:');
    this.logger.log(`  Environment: ${config.nodeEnv}`);
    this.logger.log(`  Port: ${config.port}`);
    this.logger.log(`  Database: ${config.database.uri.replace(/\/\/.*@/, '//***@')}`);
    this.logger.log(`  Redis: ${config.redis.host}:${config.redis.port}`);
    this.logger.log(`  Worker Concurrency:`);
    this.logger.log(`    - Onboarding Checks: ${config.worker.onboardingChecksConcurrency}`);
    this.logger.log(`    - Email Processing: ${config.worker.emailProcessingConcurrency}`);
    this.logger.log(`    - Data Extraction: ${config.worker.dataExtractionConcurrency}`);
    this.logger.log(`    - Document Signing: ${config.worker.documentSigningConcurrency}`);
    this.logger.log(`    - Deal Desk: ${config.worker.dealDeskConcurrency}`);
    this.logger.log(`  Log Level: ${config.logging.level}`);
    this.logger.log(`  MFA Enabled: ${config.security.mfaEnabled}`);
    this.logger.log(`  Debug Mode: ${config.development.debugMode}`);
  }
}
