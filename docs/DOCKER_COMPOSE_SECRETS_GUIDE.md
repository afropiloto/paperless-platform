# Docker Compose Secrets Management Guide

## Overview

The `docker-compose.yml` file has been updated to support runtime configuration of passwords and credentials via environment variables. This allows you to set passwords without hardcoding them in the YAML file.

## Configuration Methods

### Method 1: Using a `.env` File (Recommended for Development)

Create a `.env` file in the same directory as `docker-compose.yml`:

```bash
# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password-here
MONGO_DATABASE=tradedocs

# Redis Configuration
REDIS_PASSWORD=your-redis-password-here

# Mongo Express Configuration (optional, for monitoring)
MONGO_EXPRESS_USERNAME=admin
MONGO_EXPRESS_PASSWORD=your-mongo-express-password

# Redis Commander Configuration (optional, for monitoring)
REDIS_COMMANDER_USER=admin
REDIS_COMMANDER_PASSWORD=your-redis-commander-password
```

**Important**: Add `.env` to your `.gitignore` file to prevent committing secrets!

Docker Compose automatically reads the `.env` file when you run `docker-compose up`.

### Method 2: Command Line Environment Variables

Set environment variables before running docker-compose:

**Linux/Mac:**
```bash
export MONGO_ROOT_PASSWORD=your-secure-password
export REDIS_PASSWORD=your-redis-password
docker-compose up -d
```

**Windows (PowerShell):**
```powershell
$env:MONGO_ROOT_PASSWORD="your-secure-password"
$env:REDIS_PASSWORD="your-redis-password"
docker-compose up -d
```

**Windows (CMD):**
```cmd
set MONGO_ROOT_PASSWORD=your-secure-password
set REDIS_PASSWORD=your-redis-password
docker-compose up -d
```

### Method 3: Inline Environment Variables

Set variables directly in the command:

**Linux/Mac:**
```bash
MONGO_ROOT_PASSWORD=secure123 REDIS_PASSWORD=redis123 docker-compose up -d
```

**Windows (PowerShell):**
```powershell
$env:MONGO_ROOT_PASSWORD="secure123"; $env:REDIS_PASSWORD="redis123"; docker-compose up -d
```

### Method 4: Using a Separate Environment File

Create a custom environment file (e.g., `env.production`):

```bash
# env.production
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=production-password-here
REDIS_PASSWORD=production-redis-password
```

Then use it with docker-compose:

```bash
docker-compose --env-file env.production up -d
```

## Environment Variables Reference

### MongoDB Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_ROOT_USERNAME` | `admin` | MongoDB root username |
| `MONGO_ROOT_PASSWORD` | `password` | MongoDB root password (⚠️ **CHANGE IN PRODUCTION**) |
| `MONGO_DATABASE` | `tradedocs` | Initial database name |

### Redis Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_PASSWORD` | *(empty)* | Redis password (optional, leave empty for no password) |

### Mongo Express Variables (Monitoring Tool)

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_EXPRESS_USERNAME` | `admin` | Mongo Express web UI username |
| `MONGO_EXPRESS_PASSWORD` | `password` | Mongo Express web UI password |

### Redis Commander Variables (Monitoring Tool)

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_COMMANDER_USER` | `admin` | Redis Commander web UI username |
| `REDIS_COMMANDER_PASSWORD` | `password` | Redis Commander web UI password |

## Security Best Practices

### 1. **Never Commit Secrets**
- ✅ Add `.env` to `.gitignore`
- ✅ Use `.env.example` as a template (without real passwords)
- ✅ Use secret management services in production (AWS Secrets Manager, HashiCorp Vault, etc.)

### 2. **Use Strong Passwords**
- Use at least 16 characters
- Include uppercase, lowercase, numbers, and special characters
- Use a password manager to generate and store passwords

### 3. **Different Passwords for Different Environments**
- Use different passwords for development, staging, and production
- Never reuse production passwords in development

### 4. **Rotate Passwords Regularly**
- Change passwords periodically
- Update environment variables when rotating

### 5. **Production Deployment**
For production, consider:
- Using Docker Secrets (Docker Swarm)
- Using Kubernetes Secrets
- Using external secret management services
- Using environment-specific configuration files

## Examples

### Development Setup

```bash
# Create .env file
cat > .env << EOF
MONGO_ROOT_PASSWORD=dev-password-123
REDIS_PASSWORD=dev-redis-123
EOF

# Start services
docker-compose up -d
```

### Production Setup (Using Environment Variables)

```bash
# Set production passwords
export MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 32)

# Start services
docker-compose up -d
```

### Using Docker Secrets (Docker Swarm)

```bash
# Create secrets
echo "production-mongo-password" | docker secret create mongo_root_password -
echo "production-redis-password" | docker secret create redis_password -

# Update docker-compose.yml to use secrets (requires Docker Swarm mode)
```

## Troubleshooting

### Issue: Containers can't connect to MongoDB/Redis

**Solution**: Ensure the passwords match between:
1. The environment variables you set
2. The connection strings in your application configuration

### Issue: MongoDB authentication fails

**Solution**: 
- MongoDB passwords are only set on first initialization
- If you change `MONGO_ROOT_PASSWORD` after the database is initialized, you need to:
  1. Remove the MongoDB volume: `docker-compose down -v`
  2. Set the new password
  3. Start again: `docker-compose up -d`

### Issue: Redis password not working

**Solution**:
- Ensure `REDIS_PASSWORD` is set in the same environment where you run docker-compose
- Check that your application's Redis client is configured with the password
- Verify Redis is actually requiring a password by checking logs: `docker-compose logs redis`

## Migration from Hardcoded Passwords

If you're migrating from the old hardcoded passwords:

1. **Stop containers:**
   ```bash
   docker-compose down
   ```

2. **Create `.env` file** with your desired passwords

3. **Update application configuration** to use the same passwords

4. **Start containers:**
   ```bash
   docker-compose up -d
   ```

**Note**: If MongoDB was already initialized with the old password, you'll need to either:
- Use the old password in your `.env` file, OR
- Remove volumes and reinitialize: `docker-compose down -v && docker-compose up -d`

## Additional Resources

- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)
- [12-Factor App: Config](https://12factor.net/config)
