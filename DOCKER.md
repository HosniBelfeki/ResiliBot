# Docker Deployment Guide

This guide explains how to run ResiliBot using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- AWS credentials configured (for production)

## Quick Start

### 1. Build and Run with Docker Compose

```bash
# Build and start the frontend
docker-compose up -d frontend

# View logs
docker-compose logs -f frontend

# Access the dashboard
open http://localhost:3000
```

### 2. Development with LocalStack (Optional)

For local AWS service emulation:

```bash
# Start frontend + LocalStack
docker-compose --profile dev up -d

# LocalStack services available at:
# - API Gateway: http://localhost:4566
# - DynamoDB: http://localhost:4566
# - Lambda: http://localhost:4566
```

### 3. Production Deployment

```bash
# Set your API endpoint
export API_URL=https://your-api-gateway-url.amazonaws.com/prod

# Build and run
docker-compose up -d frontend
```

## Docker Commands

### Build Image

```bash
# Build frontend image
docker build -t resilibot-frontend:latest .

# Build with custom tag
docker build -t resilibot-frontend:v1.0.0 .
```

### Run Container

```bash
# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-api.com \
  --name resilibot-frontend \
  resilibot-frontend:latest

# Run with .env file
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name resilibot-frontend \
  resilibot-frontend:latest
```

### Container Management

```bash
# Stop container
docker stop resilibot-frontend

# Start container
docker start resilibot-frontend

# Restart container
docker restart resilibot-frontend

# Remove container
docker rm resilibot-frontend

# View logs
docker logs -f resilibot-frontend

# Execute commands in container
docker exec -it resilibot-frontend sh
```

## Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d frontend

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f

# Rebuild images
docker-compose build --no-cache

# Scale services
docker-compose up -d --scale frontend=3
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
API_URL=https://your-api-gateway-url.amazonaws.com/prod

# Node Environment
NODE_ENV=production

# Optional: AWS LocalStack (for development)
AWS_ENDPOINT=http://localstack:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

## Production Deployment

### AWS ECS/Fargate

```bash
# 1. Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

docker tag resilibot-frontend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/resilibot-frontend:latest

docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/resilibot-frontend:latest

# 2. Deploy to ECS (use AWS Console or CLI)
```

### Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag image
docker tag resilibot-frontend:latest YOUR_USERNAME/resilibot-frontend:latest

# Push to Docker Hub
docker push YOUR_USERNAME/resilibot-frontend:latest
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resilibot-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: resilibot-frontend
  template:
    metadata:
      labels:
        app: resilibot-frontend
    spec:
      containers:
      - name: frontend
        image: resilibot-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://your-api.com"
---
apiVersion: v1
kind: Service
metadata:
  name: resilibot-frontend
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: resilibot-frontend
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs resilibot-frontend

# Check container status
docker ps -a

# Inspect container
docker inspect resilibot-frontend
```

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Use different port
docker run -p 3001:3000 resilibot-frontend:latest
```

### Build fails

```bash
# Clear Docker cache
docker builder prune -a

# Rebuild without cache
docker build --no-cache -t resilibot-frontend:latest .
```

## Health Checks

The container includes health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js
```

Check health status:

```bash
docker inspect --format='{{.State.Health.Status}}' resilibot-frontend
```

## Performance Optimization

### Multi-stage Build

The Dockerfile uses multi-stage builds to minimize image size:

- Base image: node:18-alpine (~40MB)
- Final image: ~150MB (vs ~1GB without optimization)

### Production Best Practices

1. Use `.dockerignore` to exclude unnecessary files
2. Run as non-root user (nextjs:1001)
3. Use standalone output for smaller bundle
4. Enable health checks
5. Set resource limits in docker-compose.yml

## Support

For issues or questions:
- GitHub Issues: https://github.com/HosniBelfeki/ResiliBot/issues
- Email: belfkihosni@gmail.com
