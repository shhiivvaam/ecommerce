# ─────────────────────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install OS-level build deps (needed for bcrypt native addon)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy the entire monorepo for NPM Workspaces to resolve correctly
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# Copy the rest of the monorepo source (in a real monorepo we'd only copy what we need, but for simplicity we copy all to resolve local workspace dependencies)
COPY . .

# Install ALL dependencies at the root
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Generate Prisma client natively (using direct binary path to avoid workspace resolution issues)
RUN ./apps/api/node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma

# Compile TypeScript using npm workspace command
RUN npm run build -w apps/api

# Verify
RUN echo "=== dist/ contents ==" && find apps/api/dist -type f -name '*.js' | head -20 && test -f apps/api/dist/src/main.js

# ─────────────────────────────────────────────────────────────
# Stage 2: Production runtime
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# tini is needed for proper signal handling, openssl is needed natively by Prisma on Alpine
RUN apk add --no-cache tini openssl

WORKDIR /app

# Copy root manifests
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# Install ONLY production dependencies at the root
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi && npm cache clean --force

# Generate Prisma client for production image (execute binary directly from workspace node_modules)
RUN ./apps/api/node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma

# Copy compiled output from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the API port
EXPOSE 3001

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the app from the proper monorepo path
CMD ["node", "apps/api/dist/src/main.js"]
