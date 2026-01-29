# Documentation Index

Welcome to the Trade Documents Platform documentation. This comprehensive guide covers everything you need to know about setting up, developing, deploying, and maintaining the platform.

## 📚 Documentation Overview

### Getting Started
- **[Main README](../README.md)** - Project overview and quick start
- **[Development Setup](DEVELOPMENT_SETUP.md)** - Complete development environment setup
- **[Architecture Overview](ARCHITECTURE_OVERVIEW.md)** - System architecture and design

### Configuration & Environment
- **[Environment Configuration](ENVIRONMENT_CONFIGURATION.md)** - Environment-based configuration management
- **[Deployment Guide](DEPLOYMENT.md)** - Docker and Kubernetes deployment instructions
- **[Kubernetes Deployment Strategy](KUBERNETES_DEPLOYMENT_STRATEGY.md)** - Multi-repo deployment strategy and GitOps approach
- **[Docker Compose Secrets Guide](DOCKER_COMPOSE_SECRETS_GUIDE.md)** - Runtime configuration of MongoDB and Redis passwords
- **[Production Deployment](PRODUCTION_DEPLOYMENT.md)** - Production deployment best practices
- **[Dockerfile Security Review](DOCKERFILE_SECURITY_REVIEW.md)** - Docker image security best practices

### System Features
- **[Onboarding Checks System](ONBOARDING_CHECKS_SYSTEM.md)** - Automated checks and verification system
- **[API Integration Guide](API_INTEGRATION_GUIDE.md)** - API usage and integration examples
- **[MFA Configuration](MFA_CONFIGURATION.md)** - Multi-factor authentication setup

### Operations & Maintenance
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Deployment Guide](DEPLOYMENT.md)** - Complete deployment instructions

## 🚀 Quick Start Paths

### For Developers
1. Start with [Development Setup](DEVELOPMENT_SETUP.md)
2. Review [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
3. Explore [Environment Configuration](ENVIRONMENT_CONFIGURATION.md)
4. Check [API Integration Guide](API_INTEGRATION_GUIDE.md)

### For DevOps Engineers
1. Review [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
2. Follow [Deployment Guide](DEPLOYMENT.md)
3. Study [Production Deployment](PRODUCTION_DEPLOYMENT.md)
4. Keep [Troubleshooting Guide](TROUBLESHOOTING.md) handy

### For System Administrators
1. Start with [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
2. Review [Environment Configuration](ENVIRONMENT_CONFIGURATION.md)
3. Follow [Production Deployment](PRODUCTION_DEPLOYMENT.md)
4. Reference [Troubleshooting Guide](TROUBLESHOOTING.md)

## 📋 Documentation Structure

```
docs/
├── README.md                           # This file - documentation index
├── DEVELOPMENT_SETUP.md                # Development environment setup
├── ARCHITECTURE_OVERVIEW.md            # System architecture and design
├── ENVIRONMENT_CONFIGURATION.md        # Configuration management
├── DEPLOYMENT.md                       # Docker and Kubernetes deployment
├── PRODUCTION_DEPLOYMENT.md            # Production deployment guide
├── ONBOARDING_CHECKS_SYSTEM.md         # Automated checks system
├── API_INTEGRATION_GUIDE.md            # API usage and integration
├── MFA_CONFIGURATION.md                # Multi-factor authentication
├── DOCKER_COMPOSE_SECRETS_GUIDE.md     # Runtime secrets for Docker Compose
├── DOCKERFILE_SECURITY_REVIEW.md       # Docker image security practices
├── KUBERNETES_DEPLOYMENT_STRATEGY.md   # Multi-repo deployment strategy
└── TROUBLESHOOTING.md                  # Troubleshooting guide
```

## 🔍 Finding Information

### By Task
- **Setting up development environment**: [Development Setup](DEVELOPMENT_SETUP.md)
- **Understanding the system**: [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- **Configuring the application**: [Environment Configuration](ENVIRONMENT_CONFIGURATION.md)
- **Configuring Docker Compose passwords**: [Docker Compose Secrets Guide](DOCKER_COMPOSE_SECRETS_GUIDE.md)
- **Deploying to production**: [Production Deployment](PRODUCTION_DEPLOYMENT.md)
- **Deploying multiple applications**: [Kubernetes Deployment Strategy](KUBERNETES_DEPLOYMENT_STRATEGY.md)
- **Troubleshooting issues**: [Troubleshooting Guide](TROUBLESHOOTING.md)

### By Role
- **Frontend Developer**: [API Integration Guide](API_INTEGRATION_GUIDE.md)
- **Backend Developer**: [Development Setup](DEVELOPMENT_SETUP.md), [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- **DevOps Engineer**: [Deployment Guide](DEPLOYMENT.md), [Production Deployment](PRODUCTION_DEPLOYMENT.md)
- **System Administrator**: [Architecture Overview](ARCHITECTURE_OVERVIEW.md), [Troubleshooting Guide](TROUBLESHOOTING.md)

### By Technology
- **Docker**: [Deployment Guide](DEPLOYMENT.md), [Docker Compose Secrets Guide](DOCKER_COMPOSE_SECRETS_GUIDE.md), [Dockerfile Security Review](DOCKERFILE_SECURITY_REVIEW.md)
- **Kubernetes**: [Deployment Guide](DEPLOYMENT.md), [Kubernetes Deployment Strategy](KUBERNETES_DEPLOYMENT_STRATEGY.md), [Production Deployment](PRODUCTION_DEPLOYMENT.md)
- **MongoDB**: [Architecture Overview](ARCHITECTURE_OVERVIEW.md), [Troubleshooting Guide](TROUBLESHOOTING.md)
- **Redis**: [Architecture Overview](ARCHITECTURE_OVERVIEW.md), [Troubleshooting Guide](TROUBLESHOOTING.md)
- **NestJS**: [Development Setup](DEVELOPMENT_SETUP.md), [Architecture Overview](ARCHITECTURE_OVERVIEW.md)

## 📖 Document Descriptions

### [Development Setup](DEVELOPMENT_SETUP.md)
Complete guide for setting up the development environment, including:
- Prerequisites and software installation
- Environment configuration
- Running applications locally
- Development workflow
- Common development tasks
- Debugging techniques

### [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
Comprehensive system architecture documentation covering:
- High-level system design
- Core components and modules
- Data architecture and flow
- Security architecture
- Scalability considerations
- Performance optimization
- Future considerations

### [Environment Configuration](ENVIRONMENT_CONFIGURATION.md)
Detailed configuration management guide including:
- Environment variable reference
- Configuration services
- Environment-specific settings
- Validation and error handling
- Docker and Kubernetes integration
- Best practices

### [Deployment Guide](DEPLOYMENT.md)
Complete deployment instructions for:
- Docker Compose deployment
- Kubernetes deployment
- Google Cloud Platform deployment
- Scaling and monitoring
- Health checks and maintenance

### [Production Deployment](PRODUCTION_DEPLOYMENT.md)
Production deployment best practices covering:
- Environment preparation
- Security considerations
- Performance optimization
- Monitoring and observability
- Backup and recovery
- Maintenance procedures

### [Onboarding Checks System](ONBOARDING_CHECKS_SYSTEM.md)
Documentation for the automated checks system:
- System overview and architecture
- Checklist templates and instances
- Automated check processors
- Manual check management
- Configuration and customization
- Troubleshooting

### [API Integration Guide](API_INTEGRATION_GUIDE.md)
API usage and integration documentation:
- Authentication and authorization
- API endpoints and usage
- Request/response formats
- Error handling
- Rate limiting
- Integration examples

### [MFA Configuration](MFA_CONFIGURATION.md)
Multi-factor authentication setup guide:
- MFA system overview
- Configuration options
- User setup process
- Security considerations
- Troubleshooting

### [Docker Compose Secrets Guide](DOCKER_COMPOSE_SECRETS_GUIDE.md)
Runtime configuration of MongoDB and Redis credentials:
- Using `.env` files and command-line variables
- Environment variable reference
- Security best practices
- Troubleshooting

### [Dockerfile Security Review](DOCKERFILE_SECURITY_REVIEW.md)
Docker image security practices for API and worker:
- Base image pinning and hardening
- Non-root execution and permissions
- Additional security recommendations

### [Kubernetes Deployment Strategy](KUBERNETES_DEPLOYMENT_STRATEGY.md)
Multi-repository deployment strategy and GitOps approach:
- Separate deployment repository structure
- Frontend application configuration
- Coordinated deployments
- Environment management with Kustomize
- CI/CD integration

### [Troubleshooting Guide](TROUBLESHOOTING.md)
Comprehensive troubleshooting reference:
- Common issues and solutions
- Debug commands and techniques
- Log analysis
- Recovery procedures
- Prevention strategies

## 🛠️ Quick Reference

### Common Commands
```bash
# Development
pnpm run start:dev:api          # Start API with hot reload
pnpm run start:dev:worker       # Start worker with hot reload
pnpm run build                  # Build applications
pnpm run test                   # Run tests

# Docker
docker-compose up -d            # Start all services
docker-compose logs -f api      # View API logs
docker-compose down             # Stop all services

# Kubernetes
kubectl apply -f k8s/           # Deploy to Kubernetes
kubectl get pods -n trade-docs-platform  # Check pod status
kubectl logs -f deployment/trade-docs-api -n trade-docs-platform  # View logs
```

### Important URLs
- **API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/api/healthcheck
- **Redis Commander**: http://localhost:8081 (with monitoring profile)
- **Mongo Express**: http://localhost:8082 (with monitoring profile)

### Key Environment Variables
```bash
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/tradedocs
REDIS_HOST=localhost
REDIS_PORT=6379
ONBOARDING_CHECKS_CONCURRENCY=5
```

## 🤝 Contributing to Documentation

### Adding New Documentation
1. Create new markdown file in `docs/` directory
2. Follow existing naming conventions
3. Add entry to this README
4. Update relevant cross-references
5. Test all examples and commands

### Updating Existing Documentation
1. Update the relevant markdown file
2. Update this README if structure changes
3. Test all examples and commands
4. Update cross-references if needed

### Documentation Standards
- Use clear, concise language
- Include code examples where helpful
- Provide step-by-step instructions
- Include troubleshooting information
- Keep information up-to-date
- Test all examples before publishing

## 📞 Getting Help

If you can't find the information you need:

1. **Check this index** - Make sure you're looking in the right place
2. **Search the documentation** - Use your editor's search function
3. **Check the troubleshooting guide** - Common issues are documented
4. **Review the architecture overview** - Understand the system design
5. **Create an issue** - Report missing or incorrect information

## 📝 Documentation Status

- ✅ **Development Setup** - Complete and tested
- ✅ **Architecture Overview** - Complete and comprehensive
- ✅ **Environment Configuration** - Complete with examples
- ✅ **Deployment Guide** - Complete with Docker and Kubernetes
- ✅ **Production Deployment** - Complete with best practices
- ✅ **Onboarding Checks System** - Complete with examples
- ✅ **API Integration Guide** - Complete with examples
- ✅ **MFA Configuration** - Complete and tested
- ✅ **Docker Compose Secrets Guide** - Complete with examples
- ✅ **Dockerfile Security Review** - Complete with recommendations
- ✅ **Kubernetes Deployment Strategy** - Complete with GitOps approach
- ✅ **Troubleshooting Guide** - Complete with common issues

---

**Welcome to the Trade Documents Platform documentation!** 📚

This comprehensive guide should help you get started, understand the system, and successfully deploy and maintain the platform. If you have any questions or suggestions for improvement, please don't hesitate to reach out.
