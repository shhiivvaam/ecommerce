# NexCart E-Commerce Platform

A production-ready, scalable, modern full-stack e-commerce platform built as a Monorepo.

## Project Architecture

- **Monorepo Strategy**: Standard NPM Workspaces.
- **Frontend (`apps/web`)**: Next.js 14, TailwindCSS, Shadcn UI, Zustand, Framer Motion, React Hook Form, Zod.
- **Backend (`apps/api`)**: NestJS, PostgreSQL, Prisma ORM, Passport JWT, Swagger.

## Setup Instructions

### 1. Install Dependencies

From the root of the project, install all workspace packages:

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env` files in both `apps/web` and `apps/api`. A default backend `.env` is already created:

#### Backend (`apps/api/.env`)

```
DATABASE_URL="postgresql://ecommerce_user:ecommerce_password@localhost:5432/ecommerce_db?schema=public"
JWT_SECRET="supers3cr3tjwt"
REDIS_URL="redis://localhost:6379" // For future caching
```

### 3. Start Database (PostgreSQL)

We provide a `docker-compose.yml` to spin up PostgreSQL quickly:

```bash
docker compose up -d
```

### 4. Database Schema & Seeding

From the `apps/api` directory, deploy the schema and run the seed script:

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Running Locally

Run the development servers across all workspaces concurrently:

```bash
npm run dev
```

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:3001>
- **Swagger Documentation**: <http://localhost:3001/api/docs>

---

## Deployment Guide

### Vercel (Frontend Deployment)

1. Push the repository to GitHub.
2. Create a new project in Vercel and import the repository.
3. Set the **Framework Preset** to `Next.js`.
4. Set the **Root Directory** to `apps/web`.
5. Add production environment variables (API URLs, etc.).
6. Click **Deploy**.

### Railway / Render (Backend Deployment)

1. Create a new PostgreSQL instance on Railway or Render.
2. Grab the `DATABASE_URL` string and put it in your backend environment configuration.
3. Create a new Web Service and link the GitHub repository.
4. Set the Root Directory to `apps/api`.
5. Specify the build command: `npm install && npx prisma generate && npm run build`.
6. Specify the start command: `npm run start:prod`.
7. Add your `JWT_SECRET`.
8. The service will automatically deploy and serve your Swagger API on `/api/docs`.

### Docker (Production Manual Deployment)

You can directly run `docker build` on `apps/api` using standard Multi-stage Node Alpine images if desired for an AWS EC2 setup.

## Core Features Implemented

- **Single-product Mode**: Admin database toggle supported via SettingsService globally overriding Product queries.
- **Dynamic Shopping Cart**: Instant sync via Zustand and localStorage persistence.
- **Beautiful UI**: Complete integration of Framer Motion and Shadcn glassmorphism design.
- **Security**: JWT Guards, Password Hashing, Helmet HTTP Headers, Global CORS.
