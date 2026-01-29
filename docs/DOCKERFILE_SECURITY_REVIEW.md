# Dockerfile Security Review

## Executive Summary

This document outlines the security review and improvements made to `Dockerfile.api` and `Dockerfile.worker`. Both Dockerfiles have been updated to follow security best practices and reduce the attack surface.

## Security Improvements Implemented

### 1. **Base Image Version Pinning**
- **Before**: `node:18-alpine` (floating tag)
- **After**: `node:20-alpine3.19` (specific version matching application requirements)
- **Rationale**: Floating tags can change unexpectedly, introducing security vulnerabilities or breaking changes. Pinning to a specific version ensures reproducible builds and allows for controlled updates. Updated to Node.js 20 to match the application's Node.js version requirement.

### 2. **Build Metadata and Traceability**
- Added OpenContainer labels for image metadata
- Added build arguments (`BUILD_DATE`, `VCS_REF`) for traceability
- **Rationale**: Enables better tracking of image provenance and security scanning

### 3. **Package Manager Security**
- Added `--no-audit` flag` to pnpm install commands
- Removed npm/pnpm after installation in production stage
- Cleaned npm cache and temporary files
- **Rationale**: 
  - Reduces attack surface by removing unnecessary tools
  - Prevents package manager vulnerabilities from being exploited
  - Note: Security audits should be performed in CI/CD pipeline, not during build

### 4. **Environment Variables**
- Set `NODE_ENV=production` explicitly
- Disabled npm update notifications and telemetry
- **Rationale**: Ensures production optimizations and reduces unnecessary network calls

### 5. **File Permissions**
- Set appropriate file permissions (755 for directories, 644 for files)
- Ensured non-root user ownership before switching users
- **Rationale**: Follows principle of least privilege

### 6. **Health Check Improvements**
- **API**: Enhanced error handling in healthcheck command
- **Worker**: Installed `procps-ng` for proper process monitoring
- Increased `start-period` to 40s for proper initialization
- **Rationale**: Better process monitoring and failure detection

### 7. **Layer Optimization**
- Combined RUN commands where possible to reduce layers
- **Rationale**: Smaller image size and fewer potential attack vectors

## Security Best Practices Already in Place

✅ **Multi-stage builds** - Reduces final image size and attack surface  
✅ **Non-root user** - Running as `nestjs` user (UID 1001)  
✅ **Alpine Linux** - Minimal base image reduces attack surface  
✅ **Production dependencies only** - Using `--prod` flag  
✅ **Frozen lockfile** - Ensures reproducible builds  
✅ **Comprehensive .dockerignore** - Prevents sensitive files from being copied  

## Additional Security Recommendations

### 1. **Regular Base Image Updates**
- Regularly update the base image to include security patches
- Consider using a tool like Dependabot or Renovate for automated updates
- Review and test updates before deploying to production

### 2. **Image Scanning**
- Integrate image scanning into CI/CD pipeline (e.g., Trivy, Snyk, Clair)
- Scan images before deployment
- Set up automated scanning on image push

### 3. **Secrets Management**
- **Never** commit secrets to Docker images
- Use Docker secrets, environment variables, or secret management services
- Ensure `.env` files are in `.dockerignore` (already done ✅)

### 4. **Read-Only Filesystem (Optional)**
Consider mounting the application directory as read-only:
```dockerfile
# Add to docker-compose or Kubernetes deployment
volumes:
  - /app:ro
```
Note: This may require adjustments if the application writes to disk.

### 5. **Node.js Security Flags (Optional)**
Consider adding Node.js security flags if needed:
```dockerfile
CMD ["node", "--disable-proto=delete", "dist/src/main-api.js"]
```

### 6. **Resource Limits**
Ensure resource limits are set in deployment configurations:
- Memory limits
- CPU limits
- Process limits

### 7. **Network Security**

#### Docker Compose
- Containers can make outbound connections by default (no need to specify in Dockerfile)
- Use explicit network names (already configured ✅)
- Containers communicate using service names (e.g., `mongodb`, `redis`)
- Consider using separate networks for different tiers if needed:
  ```yaml
  networks:
    frontend:
    backend:
    database:
  ```

#### Kubernetes
- Implement Network Policies to restrict outbound access
- Use service names for inter-pod communication
- Example Network Policy to restrict worker outbound access:
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: worker-network-policy
  spec:
    podSelector:
      matchLabels:
        app: worker
    policyTypes:
    - Egress
    egress:
    - to:
      - podSelector:
          matchLabels:
            app: mongodb
      ports:
      - protocol: TCP
        port: 27017
    - to:
      - podSelector:
          matchLabels:
            app: redis
      ports:
      - protocol: TCP
        port: 6379
  ```

#### Important Notes
- **Dockerfiles don't need `EXPOSE` for outbound ports** - containers can connect outbound by default
- The `EXPOSE` directive is only for documenting inbound ports (doesn't actually open ports)
- Port restrictions should be configured at the orchestration level (docker-compose, Kubernetes)

### 8. **Regular Security Audits**
- Run `pnpm audit` in CI/CD pipeline
- Review and update dependencies regularly
- Monitor security advisories for Node.js and dependencies

## Security Checklist

- [x] Base image version pinned
- [x] Non-root user configured
- [x] Multi-stage build implemented
- [x] Production dependencies only
- [x] Package managers removed after installation
- [x] File permissions set correctly
- [x] Health checks configured
- [x] Build metadata added
- [x] Environment variables secured
- [x] .dockerignore comprehensive
- [ ] Image scanning in CI/CD (recommended)
- [ ] Secrets management verified (verify in deployment)
- [ ] Resource limits configured (verify in deployment)
- [ ] Network policies configured (verify in deployment)

## Testing Recommendations

1. **Build Test**: Verify both images build successfully
   ```bash
   docker build -f Dockerfile.api -t trade-docs-api:test .
   docker build -f Dockerfile.worker -t trade-docs-worker:test .
   ```

2. **Security Scan**: Run security scans on built images
   ```bash
   trivy image trade-docs-api:test
   trivy image trade-docs-worker:test
   ```

3. **Runtime Test**: Verify applications run correctly with non-root user
   ```bash
   docker run --rm trade-docs-api:test
   docker run --rm trade-docs-worker:test
   ```

4. **Health Check Test**: Verify health checks work correctly
   ```bash
   docker run -d --name test-api trade-docs-api:test
   docker inspect --format='{{.State.Health.Status}}' test-api
   ```

## Migration Notes

The updated Dockerfiles are backward compatible. No changes to deployment configurations should be required. However, it's recommended to:

1. Test the new images in a staging environment first
2. Verify health checks work as expected
3. Monitor application logs for any permission issues
4. Update CI/CD pipelines if they reference specific image tags

## References

- [OWASP Docker Security](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Alpine Linux Security](https://alpinelinux.org/about/)

## Changelog

### 2024 - Security Review
- Pinned base image versions
- Added build metadata labels
- Removed package managers from production stage
- Enhanced health checks
- Improved file permissions
- Added security-focused environment variables
- Optimized layer caching
