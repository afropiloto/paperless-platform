# Production Deployment Guide

This guide covers deploying the Trade Documents Platform to production environments, including Docker, Kubernetes, and cloud platforms.

## Overview

The platform supports multiple deployment strategies:

- **Docker Compose**: Simple containerized deployment
- **Kubernetes**: Scalable container orchestration
- **Google Cloud Platform**: Managed cloud services
- **AWS/Azure**: Alternative cloud platforms

## Prerequisites

### Required Tools

- **Docker & Docker Compose**: Container runtime
- **kubectl**: Kubernetes command-line tool
- **gcloud**: Google Cloud SDK (for GCP)
- **Helm**: Kubernetes package manager (optional)

### Required Access

- Kubernetes cluster access
- Container registry access
- Cloud platform access (if using cloud services)
- DNS management access

## Environment Preparation

### 1. Production Environment Variables

Create production environment file:

```bash
# .env.production
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb://admin:${MONGO_ROOT_PASSWORD}@mongodb-service:27017/tradedocs?authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
MONGO_DATABASE=tradedocs

# Redis
REDIS_HOST=redis-service
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# Worker Concurrency (optimized for production)
ONBOARDING_CHECKS_CONCURRENCY=10
EMAIL_PROCESSING_CONCURRENCY=5
DATA_EXTRACTION_CONCURRENCY=3
DOCUMENT_SIGNING_CONCURRENCY=5
DEAL_DESK_CONCURRENCY=3

# Security (strict for production)
JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
REFRESH_TOKEN_EXPIRATION=7d
MFA_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/app/logs/app.log

# External Services
BREVO_API_KEY=${BREVO_API_KEY}
BREVO_SENDER_EMAIL=${BREVO_SENDER_EMAIL}
BREVO_SENDER_NAME=${BREVO_SENDER_NAME}

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090
```

### 2. Secrets Management

#### Using Kubernetes Secrets

```bash
# Create secrets
kubectl create secret generic trade-docs-secrets \
  --from-literal=REDIS_PASSWORD=your-redis-password \
  --from-literal=MONGO_ROOT_PASSWORD=your-mongo-password \
  --from-literal=JWT_SECRET_KEY=your-jwt-secret \
  --from-literal=REFRESH_TOKEN_SECRET=your-refresh-secret \
  --from-literal=BREVO_API_KEY=your-brevo-key \
  --namespace=trade-docs-platform
```

#### Using Google Secret Manager

```bash
# Create secrets in GCP
gcloud secrets create redis-password --data-file=redis-password.txt
gcloud secrets create mongo-password --data-file=mongo-password.txt
gcloud secrets create jwt-secret --data-file=jwt-secret.txt
```

## Docker Deployment

### 1. Build Images

```bash
# Build API image
docker build -f Dockerfile.api -t trade-docs-api:latest .

# Build Worker image
docker build -f Dockerfile.worker -t trade-docs-worker:latest .

# Tag for registry
docker tag trade-docs-api:latest gcr.io/PROJECT_ID/trade-docs-api:latest
docker tag trade-docs-worker:latest gcr.io/PROJECT_ID/trade-docs-worker:latest
```

### 2. Push to Registry

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Push images
docker push gcr.io/PROJECT_ID/trade-docs-api:latest
docker push gcr.io/PROJECT_ID/trade-docs-worker:latest
```

### 3. Deploy with Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Scale Services

```bash
# Scale workers
docker-compose -f docker-compose.prod.yml up -d --scale worker=5

# Scale API
docker-compose -f docker-compose.prod.yml up -d --scale api=3
```

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Configure Secrets and ConfigMaps

```bash
# Apply configuration
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
```

### 3. Deploy Infrastructure

```bash
# Deploy Redis
kubectl apply -f k8s/redis-deployment.yaml

# Deploy MongoDB
kubectl apply -f k8s/mongodb-deployment.yaml

# Wait for infrastructure to be ready
kubectl wait --for=condition=available --timeout=300s deployment/redis -n trade-docs-platform
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n trade-docs-platform
```

### 4. Deploy Applications

```bash
# Deploy API
kubectl apply -f k8s/api-deployment.yaml

# Deploy Workers
kubectl apply -f k8s/worker-deployment.yaml
```

### 5. Verify Deployment

```bash
# Check pod status
kubectl get pods -n trade-docs-platform

# Check services
kubectl get services -n trade-docs-platform

# Get external IP
kubectl get service trade-docs-api-service -n trade-docs-platform

# Check logs
kubectl logs -f deployment/trade-docs-api -n trade-docs-platform
kubectl logs -f deployment/trade-docs-worker -n trade-docs-platform
```

## Google Cloud Platform Deployment

### 1. Prerequisites

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Authenticate
gcloud auth login
gcloud config set project PROJECT_ID

# Enable APIs
gcloud services enable container.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 2. Create GKE Cluster

```bash
# Create cluster
gcloud container clusters create trade-docs-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=e2-standard-2 \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=10

# Get credentials
gcloud container clusters get-credentials trade-docs-cluster --zone=us-central1-a
```

### 3. Deploy to GKE

```bash
# Deploy all resources
kubectl apply -f k8s/

# Check status
kubectl get all -n trade-docs-platform
```

### 4. Configure Load Balancer

```bash
# Get external IP
kubectl get service trade-docs-api-service -n trade-docs-platform

# Configure DNS
# Point your domain to the external IP
```

## Scaling and Performance

### 1. Horizontal Pod Autoscaling

The platform includes HPA configuration:

```yaml
# API HPA
minReplicas: 2
maxReplicas: 10
cpuTarget: 70%
memoryTarget: 80%

# Worker HPA
minReplicas: 3
maxReplicas: 15
cpuTarget: 70%
memoryTarget: 80%
```

### 2. Manual Scaling

```bash
# Scale API
kubectl scale deployment trade-docs-api --replicas=5 -n trade-docs-platform

# Scale Workers
kubectl scale deployment trade-docs-worker --replicas=8 -n trade-docs-platform
```

### 3. Resource Optimization

#### API Application
- **CPU**: 250m-500m
- **Memory**: 512Mi-1Gi
- **Replicas**: 2-10

#### Worker Application
- **CPU**: 250m-500m
- **Memory**: 512Mi-1Gi
- **Replicas**: 3-15

#### Database
- **CPU**: 200m-500m
- **Memory**: 1Gi-2Gi
- **Storage**: 10Gi+

#### Redis
- **CPU**: 100m-200m
- **Memory**: 256Mi-512Mi
- **Storage**: 1Gi+

## Monitoring and Observability

### 1. Health Checks

```bash
# API Health
curl https://your-domain.com/api/healthcheck

# Worker Health (check pod status)
kubectl get pods -n trade-docs-platform
```

### 2. Logging

#### Centralized Logging

```bash
# View API logs
kubectl logs -f deployment/trade-docs-api -n trade-docs-platform

# View Worker logs
kubectl logs -f deployment/trade-docs-worker -n trade-docs-platform

# View all logs
kubectl logs -f -l app=trade-docs-api -n trade-docs-platform
```

#### Log Aggregation

- **Google Cloud Logging**: Automatic with GKE
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Fluentd**: Log collection and forwarding

### 3. Metrics

#### Application Metrics

```bash
# Check metrics endpoint
curl https://your-domain.com:9090/metrics
```

#### Infrastructure Metrics

- **Google Cloud Monitoring**: Built-in with GKE
- **Prometheus**: Custom metrics collection
- **Grafana**: Metrics visualization

### 4. Alerting

Configure alerts for:

- High CPU/Memory usage
- Pod failures
- Database connection issues
- Queue depth thresholds
- API response times

## Security

### 1. Network Security

```yaml
# Network policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: trade-docs-network-policy
spec:
  podSelector:
    matchLabels:
      app: trade-docs-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3001
```

### 2. Secrets Management

```bash
# Rotate secrets regularly
kubectl create secret generic trade-docs-secrets-v2 \
  --from-literal=JWT_SECRET_KEY=new-secret \
  --namespace=trade-docs-platform

# Update deployment
kubectl patch deployment trade-docs-api \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"api","envFrom":[{"secretRef":{"name":"trade-docs-secrets-v2"}}]}]}}}}'
```

### 3. RBAC

```yaml
# Service account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: trade-docs-sa
  namespace: trade-docs-platform
---
# Role binding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: trade-docs-rb
  namespace: trade-docs-platform
subjects:
- kind: ServiceAccount
  name: trade-docs-sa
roleRef:
  kind: Role
  name: trade-docs-role
  apiGroup: rbac.authorization.k8s.io
```

## Backup and Recovery

### 1. Database Backup

```bash
# MongoDB backup
kubectl exec deployment/mongodb -n trade-docs-platform -- mongodump --out /backup

# Copy backup
kubectl cp trade-docs-platform/mongodb-pod:/backup ./mongodb-backup
```

### 2. Redis Backup

```bash
# Redis backup
kubectl exec deployment/redis -n trade-docs-platform -- redis-cli BGSAVE

# Copy backup
kubectl cp trade-docs-platform/redis-pod:/data/dump.rdb ./redis-backup
```

### 3. Application Backup

```bash
# Backup configurations
kubectl get configmap trade-docs-config -n trade-docs-platform -o yaml > config-backup.yaml
kubectl get secret trade-docs-secrets -n trade-docs-platform -o yaml > secrets-backup.yaml
```

## Maintenance

### 1. Rolling Updates

```bash
# Update API
kubectl set image deployment/trade-docs-api api=gcr.io/PROJECT_ID/trade-docs-api:v2.0.0 -n trade-docs-platform

# Update Worker
kubectl set image deployment/trade-docs-worker worker=gcr.io/PROJECT_ID/trade-docs-worker:v2.0.0 -n trade-docs-platform
```

### 2. Rollback

```bash
# Rollback API
kubectl rollout undo deployment/trade-docs-api -n trade-docs-platform

# Rollback Worker
kubectl rollout undo deployment/trade-docs-worker -n trade-docs-platform
```

### 3. Cleanup

```bash
# Delete all resources
kubectl delete namespace trade-docs-platform

# Clean up images
gcloud container images delete gcr.io/PROJECT_ID/trade-docs-api:latest
gcloud container images delete gcr.io/PROJECT_ID/trade-docs-worker:latest
```

## Troubleshooting

### 1. Common Issues

#### Pod Not Starting

```bash
# Check pod status
kubectl describe pod POD_NAME -n trade-docs-platform

# Check logs
kubectl logs POD_NAME -n trade-docs-platform
```

#### Service Not Accessible

```bash
# Check service
kubectl get service trade-docs-api-service -n trade-docs-platform

# Check endpoints
kubectl get endpoints trade-docs-api-service -n trade-docs-platform
```

#### Database Connection Issues

```bash
# Check database pod
kubectl get pods -l app=mongodb -n trade-docs-platform

# Test connection
kubectl exec -it MONGODB_POD -n trade-docs-platform -- mongosh --eval "db.adminCommand('ping')"
```

### 2. Performance Issues

#### High CPU Usage

```bash
# Check resource usage
kubectl top pods -n trade-docs-platform

# Scale up
kubectl scale deployment trade-docs-api --replicas=5 -n trade-docs-platform
```

#### Memory Issues

```bash
# Check memory usage
kubectl top pods -n trade-docs-platform

# Check for memory leaks
kubectl logs deployment/trade-docs-api -n trade-docs-platform | grep -i memory
```

## Production Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Secrets created and secured
- [ ] Images built and pushed to registry
- [ ] Database backups created
- [ ] DNS configured
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Alerting rules set up

### Post-Deployment

- [ ] Health checks passing
- [ ] API endpoints accessible
- [ ] Worker jobs processing
- [ ] Database connectivity verified
- [ ] Logs flowing correctly
- [ ] Metrics being collected
- [ ] Alerts configured
- [ ] Backup procedures tested

### Ongoing Maintenance

- [ ] Regular security updates
- [ ] Performance monitoring
- [ ] Capacity planning
- [ ] Backup verification
- [ ] Secret rotation
- [ ] Log rotation
- [ ] Resource optimization

## Support

For production deployment issues:

1. Check the [troubleshooting guide](TROUBLESHOOTING.md)
2. Review logs and metrics
3. Check Kubernetes events
4. Contact the development team
5. Create an issue in the repository

---

**Production deployment complete!** 🚀

The platform is now running in production with high availability, scalability, and monitoring.
