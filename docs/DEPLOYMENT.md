# E-Commerce Deployment Guide

This guide outlines our production deployment architecture.

> **Frontend**: Vercel (Auto-deploy via GitHub integration)
> **Backend**: AWS EC2 via Docker Hub images
> **Database**: Neon PostgreSQL (cloud)
> **Cache**: Upstash Redis (cloud)
> **CI/CD**: GitHub Actions building and pushing to Docker Hub

---

## 🏗️ Architecture Overview

```text
┌─────────────────────────────────────────────────────┐
│                    Internet                         │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
       ┌───────▼──────┐      ┌────────▼────────┐
       │    Vercel    │      │   AWS EC2       │
       │  (Next.js)   │ ────▶│  (NestJS API)   │
       │  apps/web    │      │  Docker Compose │
       └─────────────┘      └────────┬────────┘
                                     │
                         ┌───────────┼───────────┐
                         │                       │
                 ┌───────▼──────┐     ┌──────────▼──────┐
                 │ Neon Postgres│     │  Upstash Redis  │
                 │  (cloud DB)  │     │   (cloud cache) │
                 └──────────────┘     └─────────────────┘
```

---

## 🔄 Automated CI/CD (GitHub Actions)

Our unified pipeline (`.github/workflows/deploy.yml`) matches the production architecture. It implements smart change detection using `dorny/paths-filter` to rebuild only the affected applications.

### Pipeline Workflow

1. **Change Detection:** Checks whether frontend or backend (or both) files changed.
2. **Backend Flow:**
   - Builds Backend Image (`apps/api`)
   - Pushes to Docker Hub (`<DOCKERHUB_USERNAME>/ecommerce-api`)
   - Deploys to AWS EC2 by securely executing `scripts/deploy.sh` via SSH.
3. **Frontend Flow:**
   - Lints the Frontend.
   - Builds and Smoke Tests a Docker image for validation.
   - Pushes to Docker Hub (`<DOCKERHUB_USERNAME>/ecommerce-web`) as a backup.
   - Vercel automatically deploys the frontend from the GitHub push event via its native integration.

### Setting up GitHub Secrets

Add the following secrets to **Settings → Secrets and Variables → Actions**:

| Secret | Value | Description |
|--------|-------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub Username | For storing the built images |
| `DOCKERHUB_TOKEN` | Your Docker Hub Access Token | Used to authenticate Docker pushes |
| `EC2_HOST` | e.g., `api.example.com` | Your EC2 public IP or domain |
| `EC2_USER` | `ec2-user` or `ubuntu` | ssh user depending on AMI |
| `EC2_SSH_KEY` | `-----BEGIN PRIVATE KEY...` | Private key to SSH into EC2 instance |
| `NEXT_PUBLIC_API_URL`| e.g., `https://api.example.com/api` | API URL for frontend Docker smoke test |

---

## 🚀 Part 1 — Backend: Deploy to AWS EC2

### 1.1 Launch an EC2 Instance

| Setting | Value |
|---------|-------|
| AMI | Amazon Linux 2023 or Ubuntu 22.04 LTS |
| Instance type | `t3.small` (2 vCPU, 2 GB RAM) minimum |
| Storage | 20 GB gp3 |
| Security Group | Inbound: TCP 22 (SSH), TCP 3001 (API/Custom), TCP 443 (HTTPS via Nginx Optional) |

### 1.2 One-Time Server Setup

SSH into your server and install Docker and Docker Compose (if not already installed).

```bash
# SSH into your server
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Create necessary directories
mkdir -p ~/ecommerce
cd ~/ecommerce
```

### 1.3 Setup Environment Variables & Compose

On your **EC2 instance**, prepare the environment and compose configuration:

**1. Create `~/ecommerce/.env`**:

```env
DATABASE_URL="postgres://user:password@neon.tech/dbname?sslmode=require"
JWT_SECRET="super-strong-production-secret"
REDIS_URL="rediss://default:password@upstash.io:6379"
FRONTEND_URL="https://your-vercel-domain.vercel.app"
```

**2. Copy `docker-compose.yml`**:
Ensure an up-to-date `docker-compose.yml` is present in `~/ecommerce/`, heavily stripped down to only run the API container referencing the Docker Hub image:

```yaml
version: '3.8'
services:
  api:
    image: ${DOCKERHUB_USERNAME}/ecommerce-api:latest
    container_name: ecommerce-api
    restart: always
    env_file: .env
    ports:
      - "3001:3001"
```

### 1.4 GitHub Actions Takes Over

Whenever you push to the `main` branch, the GitHub Action will automatically:

- Build and push the backend image to Docker Hub.
- Upload `scripts/deploy.sh` to `~/ecommerce/`.
- SSH into your EC2 and run `bash ~/ecommerce/deploy.sh <image> <tag>` which pulls the latest Docker Hub image and restarts the container!

---

## 🌐 Part 2 — Frontend: Deploy to Vercel

The Vercel deployment is completely streamlined through their GitHub integration.

### 2.1 Import the Project

1. Go to [vercel.com](https://vercel.com) → **New Project**.
2. Import your GitHub repository.
3. Set **Root Directory** to `apps/web`.
4. Framework Preset: **Next.js** (auto-detected).

### 2.2 Set Environment Variables

In Vercel Project → **Settings → Environment Variables**:

| Variable | Value | Environments |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api` | Production, Preview, Development |

### 2.3 Deploy

Click **Deploy**!
Vercel handles everything going forward. When code is pushed to `main`, Vercel immediately notices and triggers a build while GitHub Actions also validates the build.

---

## 🛠️ Part 3 — Useful Commands (EC2 Backend)

### View API Logs

```bash
ssh ec2-user@<EC2_IP>
cd ~/ecommerce
docker compose logs -f api
```

### Manual Restart API

```bash
cd ~/ecommerce
docker compose restart api
```

### Run Prisma Migrations Manually

```bash
cd ~/ecommerce
docker compose exec api npx prisma migrate deploy
```

### Verify API Health

```bash
curl http://<EC2_IP>:3001/api/health
```

---

## ✅ Checklist Before Going Live

- [ ] Ensure `JWT_SECRET` is strong (64+ chars).
- [ ] Connect Neon PostgreSQL URL.
- [ ] Connect Upstash Redis URL.
- [ ] Whitelist EC2 IP in Neon DB if required.
- [ ] Setup Nginx on EC2 and enable HTTPS with Certbot to serve the API securely.
- [ ] Configure GitHub Secrets accurately.
- [ ] Test end-to-end: register user → add to cart → checkout.
