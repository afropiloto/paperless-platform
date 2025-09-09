import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  EnvironmentConfig, 
  WorkerConfig, 
  DatabaseConfig, 
  RedisConfig, 
  ApiConfig, 
  LoggingConfig, 
  SecurityConfig, 
  ExternalServicesConfig, 
  FileStorageConfig, 
  HealthCheckConfig, 
  MonitoringConfig, 
  DevelopmentConfig 
} from './environment.config';

@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {}

  get environment(): EnvironmentConfig {
    return this.configService.get<EnvironmentConfig>('environment');
  }

  get worker(): WorkerConfig {
    return this.configService.get<WorkerConfig>('environment.worker');
  }

  get database(): DatabaseConfig {
    return this.configService.get<DatabaseConfig>('environment.database');
  }

  get redis(): RedisConfig {
    return this.configService.get<RedisConfig>('environment.redis');
  }

  get api(): ApiConfig {
    return this.configService.get<ApiConfig>('environment.api');
  }

  get logging(): LoggingConfig {
    return this.configService.get<LoggingConfig>('environment.logging');
  }

  get security(): SecurityConfig {
    return this.configService.get<SecurityConfig>('environment.security');
  }

  get externalServices(): ExternalServicesConfig {
    return this.configService.get<ExternalServicesConfig>('environment.externalServices');
  }

  get fileStorage(): FileStorageConfig {
    return this.configService.get<FileStorageConfig>('environment.fileStorage');
  }

  get healthCheck(): HealthCheckConfig {
    return this.configService.get<HealthCheckConfig>('environment.healthCheck');
  }

  get monitoring(): MonitoringConfig {
    return this.configService.get<MonitoringConfig>('environment.monitoring');
  }

  get development(): DevelopmentConfig {
    return this.configService.get<DevelopmentConfig>('environment.development');
  }

  // Convenience methods for common configurations
  get isDevelopment(): boolean {
    return this.environment.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.environment.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.environment.nodeEnv === 'test';
  }

  get port(): number {
    return this.environment.port;
  }

  get nodeEnv(): string {
    return this.environment.nodeEnv;
  }

  // Worker concurrency getters
  get onboardingChecksConcurrency(): number {
    return this.worker.onboardingChecksConcurrency;
  }

  get emailProcessingConcurrency(): number {
    return this.worker.emailProcessingConcurrency;
  }

  get dataExtractionConcurrency(): number {
    return this.worker.dataExtractionConcurrency;
  }

  get documentSigningConcurrency(): number {
    return this.worker.documentSigningConcurrency;
  }

  get dealDeskConcurrency(): number {
    return this.worker.dealDeskConcurrency;
  }

  // Database configuration getters
  get mongodbUri(): string {
    return this.database.uri;
  }

  get mongodbRootUsername(): string {
    return this.database.rootUsername;
  }

  get mongodbRootPassword(): string {
    return this.database.rootPassword;
  }

  get mongodbDatabase(): string {
    return this.database.database;
  }

  // Redis configuration getters
  get redisHost(): string {
    return this.redis.host;
  }

  get redisPort(): number {
    return this.redis.port;
  }

  get redisPassword(): string | undefined {
    return this.redis.password;
  }

  // Security configuration getters
  get jwtSecret(): string {
    return this.security.jwtSecret;
  }

  get jwtExpiresIn(): string {
    return this.security.jwtExpiresIn;
  }

  get refreshTokenSecret(): string {
    return this.security.refreshTokenSecret;
  }

  get refreshTokenExpiration(): string {
    return this.security.refreshTokenExpiration;
  }

  get mfaEnabled(): boolean {
    return this.security.mfaEnabled;
  }

  // Logging configuration getters
  get logLevel(): string {
    return this.logging.level;
  }

  get logFormat(): string {
    return this.logging.format;
  }

  get logFileEnabled(): boolean {
    return this.logging.fileEnabled;
  }

  get logFilePath(): string {
    return this.logging.filePath;
  }

  // External services configuration getters
  get brevoApiKey(): string {
    return this.externalServices.brevoApiKey;
  }

  get brevoSenderEmail(): string {
    return this.externalServices.brevoSenderEmail;
  }

  get brevoSenderName(): string {
    return this.externalServices.brevoSenderName;
  }

  // File storage configuration getters
  get fileStoragePath(): string {
    return this.fileStorage.path;
  }

  get maxFileSize(): number {
    return this.fileStorage.maxFileSize;
  }

  get allowedFileTypes(): string[] {
    return this.fileStorage.allowedFileTypes;
  }

  // Health check configuration getters
  get healthCheckTimeout(): number {
    return this.healthCheck.timeout;
  }

  get healthCheckInterval(): number {
    return this.healthCheck.interval;
  }

  // Monitoring configuration getters
  get metricsEnabled(): boolean {
    return this.monitoring.enabled;
  }

  get metricsPort(): number {
    return this.monitoring.port;
  }

  // Development configuration getters
  get debugMode(): boolean {
    return this.development.debugMode;
  }

  get hotReload(): boolean {
    return this.development.hotReload;
  }
}
