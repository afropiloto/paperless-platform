# Troubleshooting Guide

This guide helps diagnose and resolve common issues with the Trade Documents Platform.

## Quick Diagnostics

### 1. Check Application Status

```bash
# Check if applications are running
ps aux | grep -E "(main-api|main-worker)"

# Check ports
netstat -tulpn | grep -E ":(3001|6379|27017)"

# Check Docker containers
docker ps | grep trade-docs
```

### 2. Check Logs

```bash
# API logs
pnpm run start:dev:api

# Worker logs
pnpm run start:dev:worker

# Docker logs
docker-compose logs -f api
docker-compose logs -f worker

# Kubernetes logs
kubectl logs -f deployment/trade-docs-api -n trade-docs-platform
kubectl logs -f deployment/trade-docs-worker -n trade-docs-platform
```

### 3. Check Health Endpoints

```bash
# API health
curl http://localhost:3001/api/healthcheck

# Expected response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## Common Issues

### 1. Application Won't Start

#### Issue: "Cannot find module 'express'"

**Symptoms:**
```
Error: Cannot find module 'express'
Require stack:
- C:\Users\...\dist\src\main-api.js
```

**Solution:**
```bash
# Install express dependency
pnpm add express

# Or using npm
npm install express
```

#### Issue: "Cannot find module '../base/base-email.provider'"

**Symptoms:**
```
Error: Cannot find module '../base/base-email.provider'
```

**Solution:**
```bash
# Clean and rebuild
rm -rf dist
pnpm run build

# Check file exists
ls src/email-client/providers/base/
```

#### Issue: "Port 3001 is already in use"

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find process using port
lsof -i :3001
# or
netstat -tulpn | grep :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 pnpm run start:dev:api
```

#### Issue: "Module not found" errors

**Symptoms:**
```
Error: Cannot find module 'some-module'
```

**Solution:**
```bash
# Clean install
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# Check package.json
cat package.json | grep "some-module"
```

### 2. Database Connection Issues

#### Issue: "MongoServerError: Authentication failed"

**Symptoms:**
```
MongoServerError: Authentication failed
```

**Solution:**
```bash
# Check MongoDB URI
echo $MONGODB_URI

# Test connection
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"

# Check credentials
mongosh --username admin --password password --authenticationDatabase admin
```

#### Issue: "MongoNetworkError: connect ECONNREFUSED"

**Symptoms:**
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# Check if MongoDB is running
brew services list | grep mongodb
# or
sudo systemctl status mongod

# Start MongoDB
brew services start mongodb/brew/mongodb-community
# or
sudo systemctl start mongod

# Check port
netstat -tulpn | grep :27017
```

#### Issue: "MongoParseError: Invalid connection string"

**Symptoms:**
```
MongoParseError: Invalid connection string
```

**Solution:**
```bash
# Check MONGODB_URI format
echo $MONGODB_URI

# Should be: mongodb://username:password@host:port/database
# Example: mongodb://admin:password@localhost:27017/tradedocs
```

### 3. Redis Connection Issues

#### Issue: "Redis connection failed"

**Symptoms:**
```
Redis connection failed
```

**Solution:**
```bash
# Check Redis status
brew services list | grep redis
# or
sudo systemctl status redis

# Start Redis
brew services start redis
# or
sudo systemctl start redis

# Test connection
redis-cli ping
# Should return: PONG
```

#### Issue: "Redis authentication failed"

**Symptoms:**
```
Redis authentication failed
```

**Solution:**
```bash
# Check Redis password
echo $REDIS_PASSWORD

# Test with password
redis-cli -a "$REDIS_PASSWORD" ping

# Check Redis configuration
redis-cli CONFIG GET requirepass
```

### 4. Worker Processing Issues

#### Issue: "Worker not processing jobs"

**Symptoms:**
- Jobs added to queue but not processed
- Worker logs show no activity

**Solution:**
```bash
# Check worker status
ps aux | grep main-worker

# Check Redis queue
redis-cli
> KEYS *queue*
> LLEN onboarding-checks-queue
> LRANGE onboarding-checks-queue 0 -1

# Check worker logs
pnpm run start:dev:worker
```

#### Issue: "Job processing failed"

**Symptoms:**
```
Job processing failed: Error message
```

**Solution:**
```bash
# Check job details
redis-cli
> LRANGE onboarding-checks-queue 0 -1

# Check worker logs for error details
kubectl logs deployment/trade-docs-worker -n trade-docs-platform

# Retry failed job
# Jobs are automatically retried based on configuration
```

#### Issue: "High queue depth"

**Symptoms:**
- Queue has many pending jobs
- Slow processing

**Solution:**
```bash
# Check queue depth
redis-cli LLEN onboarding-checks-queue

# Scale workers
kubectl scale deployment trade-docs-worker --replicas=5 -n trade-docs-platform

# Check worker concurrency
echo $ONBOARDING_CHECKS_CONCURRENCY
```

### 5. Configuration Issues

#### Issue: "Configuration validation failed"

**Symptoms:**
```
Configuration validation failed: Missing required environment variables
```

**Solution:**
```bash
# Check environment file
cat .env

# Check required variables
echo $NODE_ENV
echo $MONGODB_URI
echo $REDIS_HOST
echo $JWT_SECRET_KEY

# Copy from example
cp env.example .env
```

#### Issue: "Invalid configuration value"

**Symptoms:**
```
Invalid configuration value: REDIS_PORT must be between 1 and 65535
```

**Solution:**
```bash
# Check configuration
echo $REDIS_PORT

# Should be a valid port number
export REDIS_PORT=6379
```

### 6. Docker Issues

#### Issue: "Docker build failed"

**Symptoms:**
```
Docker build failed
```

**Solution:**
```bash
# Check Dockerfile syntax
docker build -f Dockerfile.api -t test .

# Check for missing files
ls -la Dockerfile.api
ls -la .dockerignore

# Clean Docker cache
docker system prune -a
```

#### Issue: "Container won't start"

**Symptoms:**
```
Container exited with code 1
```

**Solution:**
```bash
# Check container logs
docker logs <container-id>

# Check container status
docker ps -a

# Check environment variables
docker run --env-file .env trade-docs-api:latest env
```

#### Issue: "Port binding failed"

**Symptoms:**
```
Port binding failed: port already in use
```

**Solution:**
```bash
# Check port usage
docker ps | grep :3001

# Use different port
docker run -p 3002:3001 trade-docs-api:latest

# Or stop conflicting container
docker stop <container-id>
```

### 7. Kubernetes Issues

#### Issue: "Pod not starting"

**Symptoms:**
```
Pod status: Pending or CrashLoopBackOff
```

**Solution:**
```bash
# Check pod status
kubectl get pods -n trade-docs-platform

# Check pod details
kubectl describe pod <pod-name> -n trade-docs-platform

# Check pod logs
kubectl logs <pod-name> -n trade-docs-platform
```

#### Issue: "Service not accessible"

**Symptoms:**
```
Service not accessible from outside cluster
```

**Solution:**
```bash
# Check service
kubectl get service trade-docs-api-service -n trade-docs-platform

# Check endpoints
kubectl get endpoints trade-docs-api-service -n trade-docs-platform

# Check ingress
kubectl get ingress -n trade-docs-platform
```

#### Issue: "Image pull failed"

**Symptoms:**
```
ImagePullBackOff: Failed to pull image
```

**Solution:**
```bash
# Check image exists
docker images | grep trade-docs-api

# Push image to registry
docker push gcr.io/PROJECT_ID/trade-docs-api:latest

# Check image pull secrets
kubectl get secrets -n trade-docs-platform
```

### 8. Performance Issues

#### Issue: "High CPU usage"

**Symptoms:**
- High CPU utilization
- Slow response times

**Solution:**
```bash
# Check resource usage
kubectl top pods -n trade-docs-platform

# Check worker concurrency
echo $ONBOARDING_CHECKS_CONCURRENCY

# Scale down concurrency
export ONBOARDING_CHECKS_CONCURRENCY=2

# Scale up replicas
kubectl scale deployment trade-docs-api --replicas=5 -n trade-docs-platform
```

#### Issue: "High memory usage"

**Symptoms:**
- High memory utilization
- Out of memory errors

**Solution:**
```bash
# Check memory usage
kubectl top pods -n trade-docs-platform

# Check for memory leaks
kubectl logs deployment/trade-docs-api -n trade-docs-platform | grep -i memory

# Increase memory limits
kubectl patch deployment trade-docs-api -p '{"spec":{"template":{"spec":{"containers":[{"name":"api","resources":{"limits":{"memory":"2Gi"}}}]}}}}'
```

#### Issue: "Slow database queries"

**Symptoms:**
- Slow API responses
- Database timeouts

**Solution:**
```bash
# Check database performance
mongosh tradedocs --eval "db.setProfilingLevel(2, {slowms: 100})"

# Check slow queries
mongosh tradedocs --eval "db.system.profile.find().sort({ts: -1}).limit(5)"

# Check indexes
mongosh tradedocs --eval "db.accounts.getIndexes()"
```

## Debug Commands

### 1. Application Debugging

```bash
# Start with debug logging
LOG_LEVEL=debug pnpm run start:dev:api

# Start with debugging enabled
pnpm run start:debug:api

# Check environment variables
printenv | grep -E "(NODE_ENV|MONGODB|REDIS|WORKER)"
```

### 2. Database Debugging

```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Check database stats
mongosh tradedocs --eval "db.stats()"

# Check collections
mongosh tradedocs --eval "show collections"

# Check indexes
mongosh tradedocs --eval "db.accounts.getIndexes()"
```

### 3. Redis Debugging

```bash
# Check Redis status
redis-cli ping

# Check Redis info
redis-cli info

# Check memory usage
redis-cli info memory

# Check keys
redis-cli KEYS "*"

# Monitor commands
redis-cli monitor
```

### 4. Queue Debugging

```bash
# Check queue status
redis-cli
> KEYS *queue*
> LLEN onboarding-checks-queue
> LRANGE onboarding-checks-queue 0 -1

# Check job details
redis-cli
> HGETALL bull:onboarding-checks-queue:123

# Clear queue (use with caution)
redis-cli DEL onboarding-checks-queue
```

### 5. Network Debugging

```bash
# Check port usage
netstat -tulpn | grep -E ":(3001|6379|27017)"

# Check DNS resolution
nslookup localhost
nslookup mongodb-service

# Check connectivity
telnet localhost 3001
telnet localhost 6379
telnet localhost 27017
```

## Log Analysis

### 1. Common Log Patterns

#### Error Patterns
```bash
# Find errors
grep -i "error" logs/app.log

# Find warnings
grep -i "warn" logs/app.log

# Find specific errors
grep -i "connection failed" logs/app.log
```

#### Performance Patterns
```bash
# Find slow requests
grep -i "slow" logs/app.log

# Find memory issues
grep -i "memory" logs/app.log

# Find timeout issues
grep -i "timeout" logs/app.log
```

### 2. Log Monitoring

```bash
# Follow logs in real-time
tail -f logs/app.log

# Follow multiple log files
tail -f logs/*.log

# Filter logs by level
grep "ERROR" logs/app.log | tail -20
```

## Recovery Procedures

### 1. Application Recovery

```bash
# Restart applications
pnpm run start:dev:api
pnpm run start:dev:worker

# Restart Docker containers
docker-compose restart api worker

# Restart Kubernetes deployments
kubectl rollout restart deployment/trade-docs-api -n trade-docs-platform
kubectl rollout restart deployment/trade-docs-worker -n trade-docs-platform
```

### 2. Database Recovery

```bash
# Restart MongoDB
brew services restart mongodb/brew/mongodb-community
# or
sudo systemctl restart mongod

# Check database integrity
mongosh tradedocs --eval "db.runCommand({dbStats: 1})"

# Restore from backup
mongorestore --db tradedocs backup/tradedocs/
```

### 3. Redis Recovery

```bash
# Restart Redis
brew services restart redis
# or
sudo systemctl restart redis

# Check Redis integrity
redis-cli --rdb /tmp/redis-backup.rdb

# Restore from backup
redis-cli --pipe < backup/redis-backup.rdb
```

## Prevention

### 1. Monitoring Setup

```bash
# Set up health checks
curl http://localhost:3001/api/healthcheck

# Set up log monitoring
tail -f logs/app.log | grep -i error

# Set up resource monitoring
kubectl top pods -n trade-docs-platform
```

### 2. Regular Maintenance

```bash
# Regular backups
mongodump --db tradedocs --out backup/$(date +%Y%m%d)
redis-cli BGSAVE

# Regular log rotation
logrotate /etc/logrotate.d/trade-docs

# Regular updates
pnpm update
kubectl rollout restart deployment/trade-docs-api -n trade-docs-platform
```

### 3. Testing

```bash
# Regular health checks
curl http://localhost:3001/api/healthcheck

# Regular queue checks
redis-cli LLEN onboarding-checks-queue

# Regular database checks
mongosh tradedocs --eval "db.adminCommand('ping')"
```

## Getting Help

If you can't resolve the issue:

1. **Check this troubleshooting guide**
2. **Review application logs**
3. **Check system resources**
4. **Verify configuration**
5. **Test with minimal configuration**
6. **Create an issue in the repository**

### Information to Include

When reporting issues, include:

- **Error messages** (full stack trace)
- **Log files** (relevant sections)
- **Configuration** (environment variables)
- **System information** (OS, Node.js version, etc.)
- **Steps to reproduce**
- **Expected vs actual behavior**

---

**Happy troubleshooting!** 🔧

Most issues can be resolved by following this guide. If you need additional help, don't hesitate to reach out to the development team.
