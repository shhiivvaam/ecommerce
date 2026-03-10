# ─────────────────────────────────────────────────────────────
# Stage 1: Dependencies
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy the root manifests and install monorepo-wide to resolve workspaces
COPY package.json package-lock.json* ./
# Copy all workspace packages just to ensure correct dependency resolution
COPY . .

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ─────────────────────────────────────────────────────────────
# Stage 2: Builder
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (non-secret, baked into the bundle)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Run build target within the exact workspace
RUN mkdir -p apps/web/public && npm run build -w apps/web

# ─────────────────────────────────────────────────────────────
# Stage 3: Production runner (Next.js Standalone in a Monorepo)
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache tini

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Pre-create necessary Next.js directories
RUN mkdir -p ./apps/web/public ./apps/web/.next/static

# Given monorepo standalone tracing, the standalone directory replicates the whole repo tree
# We copy everything inside the standalone bundle directly to the runner root
COPY --from=builder --chown=appuser:appgroup /app/apps/web/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/apps/web/.next/static ./apps/web/.next/static

# Safely copy public directory (we ensure it exists in the deps/builder phase or we just copy carefully)
COPY --from=builder --chown=appuser:appgroup /app/apps/web/public ./apps/web/public

USER appuser

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

# Start from the nested standalone location
CMD ["node", "apps/web/server.js"]
