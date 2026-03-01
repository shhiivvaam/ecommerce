# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage Monorepo Dockerfile
#
# Targets:
#   api  → runs apps/api/dist/src/main.js on port 3001
#   web  → runs apps/web standalone Next.js on port 3000
#
# Build with:
#   docker build --target api -t ecommerce-api:latest .
#   docker build --target web -t ecommerce-web:latest .
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install production deps (cached layer) ──────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json     ./apps/api/
COPY apps/web/package.json     ./apps/web/
COPY packages/                  ./packages/

RUN npm ci --omit=dev && npm cache clean --force

# ── Stage 2: Full install + build ────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/

# Full install (includes devDeps needed for tsc/prisma generate)
RUN npm ci

# Generate Prisma client then build
RUN cd apps/api && npx prisma generate
RUN npx turbo run build --filter=api

# ── Stage 3: API production image ────────────────────────────────────────────
FROM node:22-alpine AS api

RUN apk add --no-cache tini openssl ca-certificates && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Non-root user
RUN addgroup -S -g 1001 nodejs && adduser -S nodejs -u 1001

# Production node_modules from base
COPY --from=base    /app/node_modules         ./node_modules
COPY --from=base    /app/apps/api/node_modules/ ./apps/api/node_modules/

# Built artifacts
COPY --from=builder /app/apps/api/dist        ./apps/api/dist
COPY --from=builder /app/apps/api/prisma      ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Regenerate Prisma client for Alpine OpenSSL
RUN cd apps/api && npx prisma generate

RUN chown -R nodejs:nodejs /app
USER nodejs

ENV NODE_ENV=production
ENV PORT=3001
ENV NODE_OPTIONS="--max-old-space-size=256"

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/dist/src/main.js"]

# ── Stage 4: Web production image (standalone Next.js) ───────────────────────
FROM node:22-alpine AS web
RUN apk add --no-cache tini && rm -rf /var/cache/apk/*

WORKDIR /app

RUN addgroup -S -g 1001 nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=builder /app/apps/web/public           ./apps/web/public

RUN chown -R nodejs:nodejs /app
USER nodejs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
