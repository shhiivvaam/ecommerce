# REYVA E-Commerce Platform

A production-ready, highly scalable, and modern full-stack e-commerce platform built using a monorepo architecture. 

![Next.js](https://img.shields.io/badge/Next.js%2014-Black?logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

## 📋 Table of Contents
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

---

## 🏗️ Architecture & Tech Stack

This project follows a **Monorepo Strategy** using standard NPM Workspaces, separating the frontend client and the backend API while allowing them to coexist and cleanly share packages.

### Frontend (`apps/web`)
- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS, Shadcn UI
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Form Handling & Validation:** React Hook Form, Zod

### Backend (`apps/api`)
- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma ORM
- **Authentication:** Passport JWT
- **Caching:** Redis
- **Documentation:** Swagger OpenAPI

---

## ✨ Key Features

- **Store Modes:** Supports both Single-product and Multi-product store modes (globally controlled via admin interface).
- **Advanced Authentication:** Secure JWT-based auth with robust password reset functionality.
- **Data Integrity:** Implemented soft deletes for core entities and Prisma migrations.
- **Performance Optimized:** Redis caching mechanisms integrated to dramatically improve API response times.
- **Beautiful & Modern UI:** High-fidelity UI featuring glassmorphism design, Framer Motion micro-animations, and responsive layouts.
- **Dynamic Shopping Cart:** State synchronization using Zustand and `localStorage` persistence.
- **Enterprise-grade Security:** Helmet HTTP headers, global CORS, and secure password hashing.

---

## 📂 Project Structure

```text
ecommerce/
├── apps/
│   ├── web/               # Next.js 14 Frontend Application
│   └── api/               # NestJS Backend API
├── packages/              # Shared monorepo packages (if any)
├── scripts/               # Utility and deployment scripts
├── .github/workflows/     # CI/CD Pipelines
├── docker-compose.yml     # Local services (PostgreSQL, Redis)
├── README.md              # Project documentation
└── DEPLOYMENT.md          # Detailed deployment guide
```

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher recommended)
- **NPM** (v9 or higher)
- **Docker** & **Docker Compose** (for running local databases and caching layers)

---

## 🚀 Local Development Setup

### 1. Install Dependencies
Run the following command from the root of the project to install all workspace packages:

```bash
npm install
```

### 2. Configure Environment Variables
Copy the example environment files and configure them:

**Backend (`apps/api/.env`)**:
```env
DATABASE_URL="postgresql://ecommerce_user:ecommerce_password@localhost:5432/ecommerce_db?schema=public"
JWT_SECRET="supers3cr3tjwt_change_in_production"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="http://localhost:3000"
```

**Frontend (`apps/web/.env.local`)**:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### 3. Spin up Local Services (PostgreSQL & Redis)
A `docker-compose.yml` file is provided in the project root to start PostgreSQL and Redis:

```bash
docker compose up -d
```

### 4. Database Schema Setup & Seeding
From the `apps/api` directory, apply the Prisma schema and run seed scripts to populate initial data:

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
npx prisma db seed
cd ../../
```

### 5. Start Development Servers
Run the development servers across all workspaces concurrently from the project root:

```bash
npm run dev
```

The applications will be available at:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001/api](http://localhost:3001/api)
- **Swagger API Docs**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 📚 API Documentation

The backend exposes a fully documented Swagger OpenAPI interface. Once the development server is running, navigate to:

👉 **[http://localhost:3001/api/docs](http://localhost:3001/api/docs)**

This interface allows you to explore all available endpoints, required payloads, and test API calls directly from your browser.

---

## ☁️ Deployment

For comprehensive deployment instructions, including how to deploy the frontend to Vercel, the backend to an AWS EC2 instance using Docker Hub, and setting up CI/CD with GitHub Actions, please refer to the **[Deployment Guide](DEPLOYMENT.md)**.
