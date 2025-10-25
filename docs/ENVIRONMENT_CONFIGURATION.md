# Environment Configuration Guide

This document describes the environment-based configuration system for the Trade Docs Platform, including how to configure different environments and manage settings.

## Overview

The platform uses a comprehensive environment configuration system that allows for:
- Environment-specific settings (development, production, test)
- Worker concurrency configuration
- Database and Redis configuration
- Security settings
- Logging configuration
- External service integration
- File storage settings
- Health check configuration
- Monitoring configuration

## Configuration Files

### 1. Environment Files

#### `env.example`
Template file containing all available environment variables with default values.

#### `env.development`
Development-specific configuration with relaxed security and lower resource usage.

#### `env.production`
Production-specific configuration with strict security and optimized performance.

### 2. Configuration Services

#### `ConfigurationService`
Main service providing typed access to all configuration values.

#### `ProcessorConfigService`
Service managing worker processor configurations and concurrency settings.

#### `ConfigurationValidationService`
Service validating configuration on startup and providing warnings for potential issues.

## Environment Variables

### Core Configuration

| Variable   | Description             | Default       | Required |
|------------|-------------------------|---------------|----------|
| `NODE_ENV` | Application environment | `development` | Yes      |
| `PORT`     | API server port         | `3001`        | No       |

### Database Configuration

| Variable              | Description               | Default                               | Required |
|-----------------------|---------------------------|---------------------------------------|----------|
| `MONGODB_URI`         | MongoDB connection string | `mongodb://localhost:27017/tradedocs` | Yes      |
| `MONGO_ROOT_USERNAME` | MongoDB root username     | `admin`                               | No       |
| `MONGO_ROOT_PASSWORD` | MongoDB root password     | `password`                            | No       |
| `MONGO_DATABASE`      | MongoDB database name     | `tradedocs`                           | No       |

### Redis Configuration

| Variable         | Description    | Default     | Required |
|------------------|----------------|-------------|----------|
| `REDIS_HOST`     | Redis host     | `localhost` | No       |
| `REDIS_PORT`     | Redis port     | `6379`      | No       |
| `REDIS_PASSWORD` | Redis password | -           | No       |

### Worker Configuration

| Variable                        | Description                          | Default | Development | Production |
|---------------------------------|--------------------------------------|---------|-------------|------------|
| `ONBOARDING_CHECKS_CONCURRENCY` | Onboarding checks worker concurrency | `5`     | `2`         | `10`       |
| `EMAIL_PROCESSING_CONCURRENCY`  | Email processing worker concurrency  | `3`     | `1`         | `5`        |
| `DATA_EXTRACTION_CONCURRENCY`   | Data extraction worker concurrency   | `2`     | `1`         | `3`        |
| `DOCUMENT_SIGNING_CONCURRENCY`  | Document signing worker concurrency  | `3`     | `1`         | `5`        |
| `DEAL_DESK_CONCURRENCY`         | Deal desk worker concurrency         | `2`     | `1`         | `3`        |

### API Configuration

| Variable               | Description                      | Default | Required |
|------------------------|----------------------------------|---------|----------|
| `API_RATE_LIMIT_TTL`   | Rate limit time window (seconds) | `60`    | No       |
| `API_RATE_LIMIT_LIMIT` | Rate limit requests per window   | `100`   | No       |
| `API_TIMEOUT`          | API request timeout (ms)         | `30000` | No       |

### Logging Configuration

| Variable           | Description         | Default          | Development      | Production          |
|--------------------|---------------------|------------------|------------------|---------------------|
| `LOG_LEVEL`        | Log level           | `info`           | `debug`          | `info`              |
| `LOG_FORMAT`       | Log format          | `json`           | `pretty`         | `json`              |
| `LOG_FILE_ENABLED` | Enable file logging | `false`          | `false`          | `true`              |
| `LOG_FILE_PATH`    | Log file path       | `./logs/app.log` | `./logs/app.log` | `/app/logs/app.log` |

### Security Configuration

| Variable                     | Description                        | Default                    | Required         |
|------------------------------|------------------------------------|----------------------------|------------------|
| `JWT_SECRET_KEY`             | JWT secret key                     | `default-jwt-secret`       | Yes (Production) |
| `JWT_EXPIRES_IN`             | JWT expiration time                | `15m`                      | No               |
| `REFRESH_TOKEN_SECRET`       | Refresh token secret               | `default-refresh-secret`   | Yes (Production) |
| `REFRESH_TOKEN_EXPIRATION`   | Refresh token expiration           | `7d`                       | No               |
| `MFA_ENABLED`                | Enable MFA                         | `true`                     | No               |
| `MFA_ISSUER`                 | MFA issuer name                    | `Trade Documents Platform` | No               |
| `PASSWORD_MIN_LENGTH`        | Minimum password length            | `8`                        | No               |
| `PASSWORD_REQUIRE_UPPERCASE` | Require uppercase in password      | `true`                     | No               |
| `PASSWORD_REQUIRE_LOWERCASE` | Require lowercase in password      | `true`                     | No               |
| `PASSWORD_REQUIRE_NUMBERS`   | Require numbers in password        | `true`                     | No               |
| `PASSWORD_REQUIRE_SPECIAL`   | Require special chars in password  | `true`                     | No               |
| `MAX_FAILED_LOGIN_ATTEMPTS`  | Max failed login attempts          | `5`                        | No               |
| `ACCOUNT_LOCKOUT_DURATION`   | Account lockout duration (minutes) | `15`                       | No               |

### External Services Configuration

| Variable             | Description                 | Default                    | Required |
|----------------------|-----------------------------|----------------------------|----------|
| `BREVO_API_KEY`      | Brevo email service API key | -                          | No       |
| `BREVO_SENDER_EMAIL` | Default sender email        | `noreply@yourdomain.com`   | No       |
| `BREVO_SENDER_NAME`  | Default sender name         | `Trade Documents Platform` | No       |

### File Storage Configuration

| Variable             | Description               | Default                     | Required |
|----------------------|---------------------------|-----------------------------|----------|
| `FILE_STORAGE_PATH`  | File storage directory    | `./uploads`                 | No       |
| `MAX_FILE_SIZE`      | Maximum file size (bytes) | `10485760` (10MB)           | No       |
| `ALLOWED_FILE_TYPES` | Allowed file extensions   | `pdf,doc,docx,jpg,jpeg,png` | No       |

### Health Check Configuration

| Variable                | Description                | Default | Required |
|-------------------------|----------------------------|---------|----------|
| `HEALTH_CHECK_TIMEOUT`  | Health check timeout (ms)  | `5000`  | No       |
| `HEALTH_CHECK_INTERVAL` | Health check interval (ms) | `30000` | No       |

### Monitoring Configuration

| Variable          | Description               | Default | Required |
|-------------------|---------------------------|---------|----------|
| `METRICS_ENABLED` | Enable metrics collection | `true`  | No       |
| `METRICS_PORT`    | Metrics server port       | `9090`  | No       |

### Development Configuration

| Variable     | Description       | Default | Development | Production |
|--------------|-------------------|---------|-------------|------------|
| `DEBUG_MODE` | Enable debug mode | `false` | `true`      | `false`    |
| `HOT_RELOAD` | Enable hot reload | `false` | `true`      | `false`    |

## Environment-Specific Settings

### Development Environment

- **Relaxed Security**: MFA disabled, shorter passwords allowed
- **Lower Concurrency**: Reduced worker concurrency to save resources
- **Debug Logging**: Verbose logging with pretty format
- **Hot Reload**: Enabled for faster development
- **File Logging**: Disabled (console only)

### Production Environment

- **Strict Security**: MFA enabled, strong password requirements
- **High Concurrency**: Optimized worker concurrency for performance
- **Structured Logging**: JSON format for log aggregation
- **File Logging**: Enabled with proper log rotation
- **Resource Monitoring**: Metrics collection enabled

## Configuration Usage

### In Services

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigurationService } from '../config/configuration.service';

@Injectable()
export class MyService {
  constructor(private readonly configService: ConfigurationService) {}

  someMethod() {
    const concurrency = this.configService.onboardingChecksConcurrency;
    const isProduction = this.configService.isProduction;
    const logLevel = this.configService.logLevel;
  }
}
```

### In Processors

```typescript
import { Processor } from '@nestjs/bullmq';
import { ConfigurationService } from '../config/configuration.service';

@Processor('my-queue', {
  concurrency: 5, // Will be overridden by environment config
})
export class MyProcessor {
  constructor(private readonly configService: ConfigurationService) {}

  async process(job: Job) {
    const concurrency = this.configService.dataExtractionConcurrency;
    // Use concurrency for processing logic
  }
}
```

## Configuration Validation

The system includes comprehensive configuration validation that:

1. **Validates Required Variables**: Ensures all required environment variables are set
2. **Validates Formats**: Checks that values are in correct formats (URLs, ports, etc.)
3. **Provides Warnings**: Warns about potential security or performance issues
4. **Logs Summary**: Displays configuration summary on startup

### Validation Examples

```typescript
// Missing required variable
Error: Missing required environment variables: MONGODB_URI

// Invalid port
Error: REDIS_PORT must be between 1 and 65535

// Security warning
WARN: JWT_SECRET_KEY is using default value - this is not secure for production

// Performance warning
WARN: Total worker concurrency is 50 - consider monitoring resource usage
```

## Docker Configuration

### Development

```yaml
# docker-compose.yml
services:
  api:
    env_file:
      - env.development
    environment:
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/tradedocs?authSource=admin
      - REDIS_HOST=redis
```

### Production

```yaml
# docker-compose.prod.yml
services:
  api:
    env_file:
      - env.production
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
```

## Kubernetes Configuration

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: trade-docs-config
data:
  NODE_ENV: "production"
  ONBOARDING_CHECKS_CONCURRENCY: "10"
  EMAIL_PROCESSING_CONCURRENCY: "5"
  # ... other configuration
```

### Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: trade-docs-secrets
data:
  JWT_SECRET_KEY: <base64-encoded>
  REDIS_PASSWORD: <base64-encoded>
  # ... other secrets
```

## Best Practices

### 1. Security

- Never commit secrets to version control
- Use strong, unique secrets for production
- Rotate secrets regularly
- Use environment-specific secrets

### 2. Performance

- Monitor worker concurrency and adjust based on load
- Use appropriate log levels for each environment
- Enable metrics collection in production
- Configure proper resource limits

### 3. Development

- Use development-specific settings for local development
- Enable debug mode and hot reload for development
- Use relaxed security settings for easier testing
- Keep development and production configurations separate

### 4. Production

- Use strict security settings
- Enable all monitoring and logging
- Configure proper resource limits
- Use external secret management (e.g., Google Secret Manager)

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Check that all required variables are set
   - Verify environment file is loaded correctly

2. **Configuration Validation Failures**
   - Review validation error messages
   - Check variable formats and values

3. **Worker Concurrency Issues**
   - Monitor resource usage
   - Adjust concurrency based on load
   - Check for bottlenecks

4. **Database Connection Issues**
   - Verify MongoDB URI format
   - Check network connectivity
   - Validate credentials

### Debug Commands

```bash
# Check environment variables
printenv | grep -E "(NODE_ENV|MONGODB|REDIS|WORKER)"

# Validate configuration
npm run start:dev:api  # Will show validation output

# Check worker concurrency
kubectl get pods -n trade-docs-platform
kubectl logs deployment/trade-docs-worker -n trade-docs-platform
```

## Migration Guide

### From Hardcoded Values

1. Replace hardcoded values with configuration service calls
2. Add environment variables to configuration files
3. Update Docker and Kubernetes configurations
4. Test in different environments

### Adding New Configuration

1. Add variable to `env.example`
2. Add to environment-specific files
3. Add to `environment.config.ts`
4. Add to `ConfigurationService`
5. Update validation if needed
6. Update documentation

This configuration system provides a robust, flexible, and maintainable way to manage application settings across different environments while ensuring security and performance best practices.
