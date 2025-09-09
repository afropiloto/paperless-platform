# Development Setup Guide

This guide covers setting up the Trade Documents Platform for local development, including all prerequisites, configuration, and common development tasks.

## Prerequisites

### Required Software

- **Node.js 18+**: [Download](https://nodejs.org/)
- **pnpm**: `npm install -g pnpm` (recommended) or use npm
- **MongoDB 7+**: [Download](https://www.mongodb.com/try/download/community) or use Docker
- **Redis 7+**: [Download](https://redis.io/download) or use Docker
- **Git**: [Download](https://git-scm.com/)

### Optional Software

- **Docker & Docker Compose**: For containerized development
- **MongoDB Compass**: Database GUI
- **Redis Commander**: Redis GUI
- **VS Code**: Recommended IDE with extensions

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "mongodb.mongodb-vscode",
    "redhat.vscode-yaml"
  ]
}
```

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd trade-docs-platform
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit configuration
code .env  # or your preferred editor
```

### 4. Configure Environment Variables

Edit `.env` file with your local settings:

```bash
# Development Environment
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/tradedocs_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Worker Concurrency (lower for development)
ONBOARDING_CHECKS_CONCURRENCY=2
EMAIL_PROCESSING_CONCURRENCY=1
DATA_EXTRACTION_CONCURRENCY=1

# Security (relaxed for development)
JWT_SECRET_KEY=dev-jwt-secret-key
MFA_ENABLED=false

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

## Infrastructure Setup

### Option 1: Docker Compose (Recommended)

```bash
# Start infrastructure services
docker-compose up -d mongodb redis

# With monitoring tools
docker-compose --profile monitoring up -d

# Check status
docker-compose ps
```

### Option 2: Local Installation

#### MongoDB

```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongod

# Windows
# Download and install from MongoDB website
```

#### Redis

```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Download and install from Redis website
```

## Running the Applications

### Development Mode

#### Terminal 1: API Application
```bash
pnpm run start:dev:api
```

#### Terminal 2: Worker Application
```bash
pnpm run start:dev:worker
```

#### Terminal 3: Monitoring (Optional)
```bash
# Redis Commander
docker run -d -p 8081:8081 rediscommander/redis-commander

# Mongo Express
docker run -d -p 8082:8081 mongo-express
```

### Debug Mode

```bash
# API with debugging
pnpm run start:debug:api

# Worker with debugging
pnpm run start:debug:worker
```

### Production Mode (Local)

```bash
# Build applications
pnpm run build

# Start API
pnpm run start:api

# Start Worker
pnpm run start:worker
```

## Verification

### 1. Check API Health

```bash
curl http://localhost:3001/api/healthcheck
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### 2. Check API Documentation

Visit: http://localhost:3001/api-docs

### 3. Check Worker Status

```bash
# Check if worker process is running
ps aux | grep main-worker

# Check Redis queues
redis-cli
> KEYS *queue*
> LLEN onboarding-checks-queue
```

### 4. Check Database Connection

```bash
# MongoDB
mongosh tradedocs_dev --eval "db.stats()"

# Redis
redis-cli ping
```

## Development Workflow

### 1. Code Changes

The development servers support hot reload:
- API changes trigger automatic restart
- Worker changes trigger automatic restart
- TypeScript compilation happens automatically

### 2. Database Changes

```bash
# Run migrations
pnpm run script:migrate-auth-fields

# Seed data
pnpm run script:seed-module-permissions
```

### 3. Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Watch mode
pnpm run test:watch

# Coverage
pnpm run test:cov
```

### 4. Linting and Formatting

```bash
# Lint code
pnpm run lint

# Format code
pnpm run format
```

## Common Development Tasks

### 1. Adding New Environment Variables

1. Add to `env.example`
2. Add to `src/config/environment.config.ts`
3. Add to `ConfigurationService`
4. Update documentation

### 2. Adding New Worker Processors

1. Create processor in appropriate module
2. Add to worker module
3. Configure concurrency in environment config
4. Add tests

### 3. Adding New API Endpoints

1. Create controller
2. Add to API module
3. Add Swagger documentation
4. Add tests

### 4. Database Schema Changes

1. Create migration script
2. Update schemas
3. Run migration
4. Update tests

## Debugging

### 1. API Debugging

```bash
# Start with debugging
pnpm run start:debug:api

# Attach debugger in VS Code
# Use "Attach to Node Process" configuration
```

### 2. Worker Debugging

```bash
# Start with debugging
pnpm run start:debug:worker

# Check worker logs
tail -f logs/worker.log
```

### 3. Database Debugging

```bash
# MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Redis logs
redis-cli monitor
```

### 4. Queue Debugging

```bash
# Check queue status
redis-cli
> KEYS *queue*
> LLEN onboarding-checks-queue
> LRANGE onboarding-checks-queue 0 -1

# Monitor queue activity
redis-cli monitor
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### 2. Database Connection Failed

```bash
# Check MongoDB status
brew services list | grep mongodb
sudo systemctl status mongod

# Check connection string
echo $MONGODB_URI
```

#### 3. Redis Connection Failed

```bash
# Check Redis status
brew services list | grep redis
sudo systemctl status redis

# Test connection
redis-cli ping
```

#### 4. Worker Not Processing Jobs

```bash
# Check worker logs
pnpm run start:dev:worker

# Check Redis connection
redis-cli ping

# Check queue
redis-cli LLEN onboarding-checks-queue
```

#### 5. Build Failures

```bash
# Clean and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# Clear build cache
rm -rf dist
pnpm run build
```

### Performance Issues

#### 1. Slow API Response

- Check database queries
- Monitor Redis performance
- Check worker concurrency settings
- Review logging configuration

#### 2. High Memory Usage

- Check worker concurrency
- Monitor queue depth
- Review memory leaks
- Adjust resource limits

## Development Tools

### 1. Database Management

```bash
# MongoDB Compass
# Connect to: mongodb://localhost:27017/tradedocs_dev

# Mongo Shell
mongosh tradedocs_dev
```

### 2. Redis Management

```bash
# Redis Commander
# Access: http://localhost:8081

# Redis CLI
redis-cli
```

### 3. API Testing

```bash
# Using curl
curl -X GET http://localhost:3001/api/healthcheck

# Using HTTPie
http GET localhost:3001/api/healthcheck

# Using Postman
# Import OpenAPI spec from http://localhost:3001/api-docs
```

### 4. Queue Management

```bash
# Add test job
pnpm run script:add-onboarding-check --event-type ONBOARDING_CHECK_DUPLICATE_REGISTRATION --checklist-instance-id test123 --registration-id test456 --onboarding-processing-id test789 --section-title "Test" --item-title "Test Check"

# Monitor queue
redis-cli monitor
```

## Best Practices

### 1. Code Organization

- Follow NestJS conventions
- Use proper module structure
- Implement proper error handling
- Write comprehensive tests

### 2. Environment Management

- Never commit `.env` files
- Use environment-specific configurations
- Validate configuration on startup
- Document all environment variables

### 3. Database Management

- Use migrations for schema changes
- Implement proper indexing
- Use transactions when needed
- Monitor query performance

### 4. Queue Management

- Implement proper error handling
- Use appropriate retry logic
- Monitor queue depth
- Implement dead letter queues

### 5. Testing

- Write unit tests for services
- Write integration tests for APIs
- Write E2E tests for workflows
- Maintain good test coverage

## Next Steps

After completing the development setup:

1. Review the [API Integration Guide](API_INTEGRATION_GUIDE.md)
2. Explore the [Onboarding Checks System](ONBOARDING_CHECKS_SYSTEM.md)
3. Check the [Environment Configuration Guide](ENVIRONMENT_CONFIGURATION.md)
4. Review the [Deployment Guide](DEPLOYMENT.md)

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review the logs for error messages
3. Check the [troubleshooting section](TROUBLESHOOTING.md)
4. Create an issue in the repository

---

Happy coding! 🚀
