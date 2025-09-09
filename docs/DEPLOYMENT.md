# Trade Docs Platform - Deployment Guide

This guide covers deploying the Trade Docs Platform API and Worker applications using Docker and Kubernetes on Google Cloud Platform.

## Architecture Overview

The platform consists of two main applications:
- **API Application**: Handles HTTP requests, serves REST endpoints
- **Worker Application**: Processes background jobs and events

Both applications share:
- **MongoDB**: Primary database
- **Redis**: Queue management and caching

## Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (GKE recommended)
- Google Cloud SDK (`gcloud`)
- `kubectl` configured for your cluster

## Local Development

### Using Docker Compose

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Start with monitoring tools:**
   ```bash
   docker-compose --profile monitoring up -d
   ```

3. **View logs:**
   ```bash
   # API logs
   docker-compose logs -f api
   
   # Worker logs
   docker-compose logs -f worker
   
   # All logs
   docker-compose logs -f
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

### Services Available

- **API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Redis Commander**: http://localhost:8081 (with monitoring profile)
- **Mongo Express**: http://localhost:8082 (with monitoring profile)

## Production Deployment

### Using Docker Compose

1. **Create production environment file:**
   ```bash
   cp .env.example .env.prod
   ```

2. **Update environment variables:**
   ```bash
   # .env.prod
   MONGODB_URI=mongodb://admin:password@mongodb:27017/tradedocs?authSource=admin
   REDIS_PASSWORD=your-secure-redis-password
   MONGO_ROOT_USERNAME=admin
   MONGO_ROOT_PASSWORD=your-secure-mongo-password
   MONGO_DATABASE=tradedocs
   ```

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Using Kubernetes on Google Cloud

#### 1. Build and Push Images

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Build and tag images
docker build -f Dockerfile.api -t gcr.io/PROJECT_ID/trade-docs-api:latest .
docker build -f Dockerfile.worker -t gcr.io/PROJECT_ID/trade-docs-worker:latest .

# Push images
docker push gcr.io/PROJECT_ID/trade-docs-api:latest
docker push gcr.io/PROJECT_ID/trade-docs-worker:latest
```

#### 2. Deploy to Kubernetes

```bash
# Create namespace and apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy infrastructure
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/mongodb-deployment.yaml

# Wait for infrastructure to be ready
kubectl wait --for=condition=available --timeout=300s deployment/redis -n trade-docs-platform
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n trade-docs-platform

# Deploy applications
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
```

#### 3. Verify Deployment

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

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment | `development` | No |
| `PORT` | API server port | `3001` | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `REDIS_HOST` | Redis host | `localhost` | No |
| `REDIS_PORT` | Redis port | `6379` | No |
| `REDIS_PASSWORD` | Redis password | - | No |
| `ONBOARDING_CHECKS_CONCURRENCY` | Worker concurrency | `5` | No |

### Scaling Configuration

#### API Application
- **Min Replicas**: 2
- **Max Replicas**: 10
- **CPU Target**: 70%
- **Memory Target**: 80%

#### Worker Application
- **Min Replicas**: 3
- **Max Replicas**: 15
- **CPU Target**: 70%
- **Memory Target**: 80%

## Monitoring and Health Checks

### Health Check Endpoints

- **API Health**: `GET /api/healthcheck`
- **Worker Health**: Process-based check

### Monitoring Tools

#### Local Development
- **Redis Commander**: Queue monitoring
- **Mongo Express**: Database monitoring

#### Production
- **Google Cloud Monitoring**: Built-in Kubernetes monitoring
- **Prometheus + Grafana**: Custom metrics (optional)

## Troubleshooting

### Common Issues

#### 1. API Not Starting
```bash
# Check logs
kubectl logs deployment/trade-docs-api -n trade-docs-platform

# Check if dependencies are ready
kubectl get pods -n trade-docs-platform
```

#### 2. Worker Not Processing Jobs
```bash
# Check worker logs
kubectl logs deployment/trade-docs-worker -n trade-docs-platform

# Check Redis connection
kubectl exec -it deployment/redis -n trade-docs-platform -- redis-cli ping
```

#### 3. Database Connection Issues
```bash
# Check MongoDB logs
kubectl logs deployment/mongodb -n trade-docs-platform

# Test connection
kubectl exec -it deployment/mongodb -n trade-docs-platform -- mongosh --eval "db.adminCommand('ping')"
```

### Debug Commands

```bash
# Get pod details
kubectl describe pod POD_NAME -n trade-docs-platform

# Execute commands in pod
kubectl exec -it POD_NAME -n trade-docs-platform -- /bin/sh

# Port forward for local access
kubectl port-forward service/trade-docs-api-service 3001:80 -n trade-docs-platform
```

## Security Considerations

### Secrets Management
- Use Kubernetes secrets for sensitive data
- Rotate secrets regularly
- Use Google Secret Manager for production

### Network Security
- Configure network policies
- Use TLS for external communication
- Restrict pod-to-pod communication

### Resource Limits
- Set appropriate CPU and memory limits
- Monitor resource usage
- Configure horizontal pod autoscaling

## Backup and Recovery

### Database Backup
```bash
# MongoDB backup
kubectl exec deployment/mongodb -n trade-docs-platform -- mongodump --out /backup

# Redis backup
kubectl exec deployment/redis -n trade-docs-platform -- redis-cli BGSAVE
```

### Persistent Volume Backups
- Use Google Cloud Storage for backups
- Schedule regular backups
- Test recovery procedures

## Performance Optimization

### Database Optimization
- Create appropriate indexes
- Monitor query performance
- Use connection pooling

### Queue Optimization
- Monitor queue depth
- Adjust worker concurrency
- Implement dead letter queues

### Application Optimization
- Use caching strategies
- Optimize Docker images
- Monitor application metrics

## Maintenance

### Rolling Updates
```bash
# Update API
kubectl set image deployment/trade-docs-api api=gcr.io/PROJECT_ID/trade-docs-api:v2.0.0 -n trade-docs-platform

# Update Worker
kubectl set image deployment/trade-docs-worker worker=gcr.io/PROJECT_ID/trade-docs-worker:v2.0.0 -n trade-docs-platform
```

### Scaling
```bash
# Scale API
kubectl scale deployment trade-docs-api --replicas=5 -n trade-docs-platform

# Scale Worker
kubectl scale deployment trade-docs-worker --replicas=8 -n trade-docs-platform
```

### Cleanup
```bash
# Delete all resources
kubectl delete namespace trade-docs-platform

# Clean up images
gcloud container images delete gcr.io/PROJECT_ID/trade-docs-api:latest
gcloud container images delete gcr.io/PROJECT_ID/trade-docs-worker:latest
```
