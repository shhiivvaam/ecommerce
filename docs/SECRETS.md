# Required Secrets for Deployment

## GitHub Repository Secrets

### Docker Hub

- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

### AWS (Optional - for ECS deployment)

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_ENABLED`: Set to 'true' to enable ECS deployment

### Vercel

- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_PROJECT_ID`: Vercel project ID
- `VERCEL_DEPLOYMENT_HOOK_ID`: Vercel deployment hook ID

### EC2 (Existing deployment)

- `EC2_HOST`: EC2 instance IP/hostname
- `EC2_USER`: SSH username (e.g., ubuntu, ec2-user)
- `EC2_SSH_KEY`: SSH private key content

### Environment Variables

- `DATABASE_URL`: Production database URL
- `JWT_SECRET`: JWT secret key
- `REDIS_URL`: Redis connection URL (if using)
- `API_BASE_URL`: Production API base URL
- `CORS_ORIGIN`: Frontend URL for CORS

## Setup Instructions

### 1. Docker Hub

```bash
# Create Docker Hub access token
# 1. Go to https://hub.docker.com/settings/security
# 2. Generate new access token
# 3. Add to GitHub secrets
```

### 2. Vercel

```bash
# Get Vercel project ID and deployment hook
# 1. Go to Vercel dashboard
# 2. Select your project
# 3. Go to Settings → Git → Deployment Hooks
# 4. Copy the hook URL and extract project ID
```

### 3. AWS (Optional)

```bash
# Create IAM user with ECS permissions
aws iam create-user --user-name github-actions
aws iam attach-user-policy --user-name github-actions --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess
aws iam create-access-key --user-name github-actions
```

### 4. EC2 SSH Key

```bash
# Convert private key to single line for GitHub secret
# Remove newlines and add "\n" at the end
awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}' ~/.ssh/your-key.pem
```

## Environment-Specific Variables

### Production (.env)

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/ecommerce_prod
JWT_SECRET=your-super-secret-jwt-key
REDIS_URL=redis://host:6379
API_BASE_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### Staging (.env.staging)

```env
NODE_ENV=staging
DATABASE_URL=postgresql://user:password@host:5432/ecommerce_staging
JWT_SECRET=your-staging-jwt-key
REDIS_URL=redis://host:6379
API_BASE_URL=https://staging.your-domain.com
CORS_ORIGIN=https://staging.your-domain.com
```
