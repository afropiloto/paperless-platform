# Kubernetes Deployment Strategy

## Overview

This document outlines the recommended approach for deploying multiple applications (backend API, worker, and frontend applications) that are in separate repositories to the same Kubernetes cluster.

## Recommended Approach: Separate Deployment Repository (GitOps)

**Yes, you should create a separate deployment repository.** This follows GitOps best practices and provides several advantages:

### Benefits

1. **Single Source of Truth** - All deployment configurations in one place
2. **Coordinated Deployments** - Deploy all services together with proper dependencies
3. **Environment Management** - Easy to manage dev/staging/production environments
4. **Version Control** - Track changes to infrastructure and deployments
5. **CI/CD Integration** - Works seamlessly with ArgoCD, Flux, or similar GitOps tools
6. **Dependency Management** - Clear visibility of how services depend on each other
7. **Rollback Capability** - Easy to rollback entire application stack

## Repository Structure

### Recommended Structure

```
trade-docs-platform-deployments/
├── README.md
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD workflows
├── environments/
│   ├── development/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml             # Encrypted or external secrets
│   │   ├── backend/
│   │   │   ├── api-deployment.yaml
│   │   │   ├── worker-deployment.yaml
│   │   │   └── kustomization.yaml
│   │   ├── frontend/
│   │   │   ├── frontend-app1-deployment.yaml
│   │   │   ├── frontend-app2-deployment.yaml
│   │   │   └── kustomization.yaml
│   │   ├── infrastructure/
│   │   │   ├── mongodb-deployment.yaml
│   │   │   ├── redis-deployment.yaml
│   │   │   └── kustomization.yaml
│   │   └── kustomization.yaml      # Root kustomization
│   ├── staging/
│   │   └── [same structure]
│   └── production/
│       └── [same structure]
├── base/                           # Base configurations (shared)
│   ├── backend/
│   │   ├── api-deployment.yaml
│   │   ├── worker-deployment.yaml
│   │   └── kustomization.yaml
│   ├── frontend/
│   │   ├── frontend-app1-deployment.yaml
│   │   ├── frontend-app2-deployment.yaml
│   │   └── kustomization.yaml
│   └── infrastructure/
│       ├── mongodb-deployment.yaml
│       ├── redis-deployment.yaml
│       └── kustomization.yaml
└── scripts/
    ├── deploy.sh
    └── update-image-tags.sh
```

## Frontend Application Configuration

### How Frontend Apps Connect to Backend API

Frontend applications need to know how to reach the backend API service. Here are the recommended approaches:

#### Option 1: Environment Variables (Recommended)

Configure the API URL via environment variables in the frontend deployment:

```yaml
# frontend-app1-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-app1
  namespace: trade-docs-platform
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: frontend
        image: your-registry/frontend-app1:latest
        env:
        # Use Kubernetes service DNS name
        - name: REACT_APP_API_URL
          value: "http://trade-docs-api-service.trade-docs-platform.svc.cluster.local"
        # Or for external access (if using LoadBalancer/Ingress)
        - name: REACT_APP_API_URL
          value: "https://api.yourdomain.com"
        ports:
        - containerPort: 80
```

#### Option 2: ConfigMap for Frontend Configuration

```yaml
# frontend-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
  namespace: trade-docs-platform
data:
  API_URL: "http://trade-docs-api-service.trade-docs-platform.svc.cluster.local"
  API_VERSION: "v1"
```

Then reference in deployment:
```yaml
envFrom:
- configMapRef:
    name: frontend-config
```

#### Option 3: Ingress with Path-Based Routing

If using an Ingress controller, you can route both frontend and API through the same domain:

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: trade-docs-ingress
  namespace: trade-docs-platform
spec:
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-app1-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: trade-docs-api-service
            port:
              number: 80
```

Then frontend can use relative URLs: `/api/...`

## Example Frontend Deployment

### Frontend App 1 Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-app1
  namespace: trade-docs-platform
  labels:
    app: frontend-app1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend-app1
  template:
    metadata:
      labels:
        app: frontend-app1
    spec:
      containers:
      - name: frontend
        image: your-registry/frontend-app1:latest
        ports:
        - containerPort: 80
        env:
        # Internal Kubernetes DNS (recommended for same namespace)
        - name: REACT_APP_API_URL
          value: "http://trade-docs-api-service:80"
        # Or use full DNS name for cross-namespace
        - name: REACT_APP_API_URL
          value: "http://trade-docs-api-service.trade-docs-platform.svc.cluster.local"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-app1-service
  namespace: trade-docs-platform
spec:
  selector:
    app: frontend-app1
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP  # Use LoadBalancer or Ingress for external access
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-app1-hpa
  namespace: trade-docs-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend-app1
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Using Kustomize for Environment Management

Kustomize allows you to have base configurations and overlay them for different environments:

### Base Configuration

```yaml
# base/backend/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- api-deployment.yaml
- worker-deployment.yaml

commonLabels:
  app: trade-docs-backend
```

### Environment-Specific Overlay

```yaml
# environments/production/backend/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: trade-docs-platform

resources:
- ../../../base/backend

patchesStrategicMerge:
- api-deployment-patch.yaml

images:
- name: trade-docs-api
  newName: gcr.io/your-project/trade-docs-api
  newTag: v1.2.3
- name: trade-docs-worker
  newName: gcr.io/your-project/trade-docs-worker
  newTag: v1.2.3
```

## Deployment Workflow

### Option 1: Manual Deployment

```bash
# Deploy all services
kubectl apply -k environments/production/

# Or deploy specific components
kubectl apply -k environments/production/backend/
kubectl apply -k environments/production/frontend/
```

### Option 2: GitOps with ArgoCD

1. Install ArgoCD in your cluster
2. Create an ArgoCD Application pointing to your deployment repo
3. ArgoCD automatically syncs changes from the repo

```yaml
# argocd-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: trade-docs-platform
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/trade-docs-platform-deployments
    targetRevision: main
    path: environments/production
  destination:
    server: https://kubernetes.default.svc
    namespace: trade-docs-platform
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Image Management

### Image Tagging Strategy

Each repository should tag images with:
- **Semantic versions**: `v1.2.3`
- **Git commit SHA**: `abc123def`
- **Branch names**: `main`, `develop`

### Updating Images

Create a script to update image tags across deployments:

```bash
#!/bin/bash
# scripts/update-image-tags.sh

ENVIRONMENT=$1
API_TAG=$2
WORKER_TAG=$3
FRONTEND1_TAG=$4
FRONTEND2_TAG=$5

cd environments/$ENVIRONMENT

# Update backend images
kustomize edit set image \
  trade-docs-api=gcr.io/your-project/trade-docs-api:$API_TAG \
  trade-docs-worker=gcr.io/your-project/trade-docs-worker:$WORKER_TAG \
  frontend-app1=gcr.io/your-project/frontend-app1:$FRONTEND1_TAG \
  frontend-app2=gcr.io/your-project/frontend-app2:$FRONTEND2_TAG

git add .
git commit -m "Update images to $API_TAG, $WORKER_TAG, $FRONTEND1_TAG, $FRONTEND2_TAG"
git push
```

## Network Policies (Security)

Add network policies to restrict traffic between services:

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-to-api
  namespace: trade-docs-platform
spec:
  podSelector:
    matchLabels:
      app: frontend-app1
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: trade-docs-api
    ports:
    - protocol: TCP
      port: 80
  - to:
    - namespaceSelector: {}  # Allow DNS
    ports:
    - protocol: UDP
      port: 53
```

## Secrets Management

### Option 1: External Secrets Operator

Use External Secrets Operator to sync secrets from external systems:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: trade-docs-secrets
  namespace: trade-docs-platform
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: trade-docs-secrets
  data:
  - secretKey: MONGO_ROOT_PASSWORD
    remoteRef:
      key: trade-docs/mongodb/password
```

### Option 2: Sealed Secrets

Use Bitnami Sealed Secrets for encrypted secrets in Git:

```bash
# Encrypt secret
kubeseal < secret.yaml > sealed-secret.yaml

# Commit sealed-secret.yaml to repo
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]
    paths:
      - 'environments/production/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v1
      
    - name: Deploy to Kubernetes
      run: |
        kubectl apply -k environments/production/
      env:
        KUBECONFIG: ${{ secrets.KUBECONFIG }}
```

## Migration Plan

### Step 1: Create Deployment Repository

1. Create new repository: `trade-docs-platform-deployments`
2. Copy existing `k8s/` files as base configurations
3. Organize into the recommended structure

### Step 2: Add Frontend Deployments

1. Create frontend deployment manifests
2. Configure API URL environment variables
3. Test connectivity

### Step 3: Set Up GitOps (Optional)

1. Install ArgoCD or Flux
2. Configure application sync
3. Test automated deployments

### Step 4: Update CI/CD

1. Update build pipelines to push images
2. Configure deployment pipelines
3. Set up image tag updates

## Best Practices

1. **Version Control Everything** - All manifests in Git
2. **Immutable Infrastructure** - Use image tags, not `latest`
3. **Environment Parity** - Same structure for dev/staging/prod
4. **Secret Management** - Never commit plain secrets
5. **Resource Limits** - Always set requests and limits
6. **Health Checks** - Configure liveness and readiness probes
7. **Monitoring** - Add labels for Prometheus/Grafana
8. **Documentation** - Document deployment process

## Alternative Approaches

### Option A: Keep Deployments in Each Repo

**Pros:**
- Each repo is self-contained
- Easier for individual teams

**Cons:**
- Harder to coordinate deployments
- Dependencies harder to manage
- No single source of truth

### Option B: Hybrid Approach

- Base manifests in deployment repo
- App-specific configs in each repo
- Deployment repo references submodules

**Pros:**
- Balance between centralization and autonomy

**Cons:**
- More complex setup
- Requires submodule management

## Conclusion

**Recommendation: Use a separate deployment repository** with the structure outlined above. This provides:

- ✅ Single source of truth for all deployments
- ✅ Easy coordination between services
- ✅ GitOps-friendly structure
- ✅ Clear environment management
- ✅ Better security and secret management
- ✅ Easier rollbacks and version control

This approach scales well as you add more services and environments.
