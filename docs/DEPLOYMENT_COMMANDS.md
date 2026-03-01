# Deployment Commands for E-Commerce Monorepo

## Local Development

### Install Dependencies

```bash
# Install all dependencies for the monorepo
npm install

# Install Turbo globally
npm install -g turbo
```

### Development Mode

```bash
# Start all applications in development mode
turbo run dev

# Start specific application
turbo run dev --filter=api
turbo run dev --filter=web
```

### Build Applications

```bash
# Build all applications and packages
turbo run build

# Build specific application
turbo run build --filter=api
turbo run build --filter=web
```

### Testing

```bash
# Run all tests
turbo run test

# Run tests for specific app
turbo run test --filter=api
turbo run test --filter=web

# Run linting
turbo run lint

# Type checking
turbo run type-check
```

## Production Deployment

### 1. Vercel Deployment (Frontend)

```bash
# Deploy frontend to Vercel
npm run deploy:vercel

# Or use Vercel CLI directly
vercel --prod
```

### 2. AWS/EC2 Deployment (Backend)

```bash
# Build and deploy Docker image
npm run deploy:full

# Individual steps
npm run build:docker
npm run push:ecr
npm run deploy:aws
```

### 3. Manual Docker Deployment

```bash
# Build Docker image
docker build -t ecommerce-api:latest .

# Run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Database Management

### Migrations

```bash
# Generate new migration
cd apps/api
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npm run migrate:prod

# Reset database (development only)
npx prisma migrate reset
```

### Database Seeding

```bash
# Seed production database
npm run seed:prod

# Seed development database
cd apps/api
npx prisma db seed
```

## Monitoring and Health Checks

### Health Endpoints

```bash
# General health check
curl https://your-domain.com/health

# Liveness probe
curl https://your-domain.com/health/live

# Readiness probe
curl https://your-domain.com/health/ready

# Metrics (Prometheus format)
curl https://your-domain.com/metrics
```

### Logs

```bash
# View application logs
docker-compose logs -f ecommerce-api

# View specific service logs
docker-compose logs -f redis

# View logs from last 24 hours
docker-compose logs --since=24h -f
```

## Troubleshooting

### Common Issues

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Force recreate containers
docker-compose up -d --force-recreate

# Check container status
docker-compose ps

# Enter container for debugging
docker-compose exec ecommerce-api sh
```

### Rollback Commands

```bash
# Quick rollback using previous image
docker-compose down
docker pull your-registry/ecommerce:previous-tag
docker-compose up -d

# Or use the deploy script with rollback
bash scripts/deploy.sh your-registry/ecommerce previous-tag
```

## Performance Optimization

### Cache Management

```bash
# Clear Redis cache (if using)
docker-compose exec redis redis-cli FLUSHALL

# Warm up application cache
curl https://your-domain.com/api/products
curl https://your-domain.com/api/categories
```

### Database Optimization

```bash
# Analyze database performance
cd apps/api
npx prisma db execute --sql "EXPLAIN ANALYZE SELECT * FROM products;"

# Update database statistics
npx prisma db execute --sql "ANALYZE;"
```

## Security

### SSL Certificate Renewal (if using certbot)

```bash
# Renew SSL certificates
sudo certbot renew

# Restart services after renewal
docker-compose restart
```

### Security Scans

```bash
# Scan Docker image for vulnerabilities
docker scan your-registry/ecommerce:latest

# Audit npm packages
npm audit
npm audit fix
```

## Environment Variables

### Production Environment Setup

```bash
# Copy environment template
cp .env.example .env.production

# Edit production environment
nano .env.production

# Load environment variables
export $(cat .env.production | xargs)
```

### Service-Specific Variables

```bash
# API Service
export NODE_ENV=production
export PORT=3000
export DATABASE_URL=postgresql://...
export JWT_SECRET=your-secret

# Web Service
export NEXT_PUBLIC_API_URL=https://your-domain.com/api
export NEXT_PUBLIC_APP_URL=https://your-domain.com
```
