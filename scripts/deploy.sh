#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh  —  Production Blue-Green Deployment with Auto-Rollback
#
# Strategy:
#   0. Pre-flight checks
#   1. Pre-cleanup (dangling images)
#   2. Pull new image
#   3. Run DB migrations in a TEMP container (abort on failure)
#   4. Start SHADOW container on temp port via strict `docker run`
#   5. Health check shadow (abort + remove shadow on failure)
#   6. Cut over: remove shadow -> docker compose up -d (brings up real container cleanly)
#   7. Print success summary
#
# Called by GitHub Actions via SSH. Lives at ~/ecommerce/deploy.sh on EC2.
# Usage: bash ~/ecommerce/deploy.sh <IMAGE> <TAG>
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}  ▶  $*${NC}"; }
log_success() { echo -e "${GREEN}  ✅ $*${NC}"; }
log_warn()    { echo -e "${YELLOW}  ⚠  $*${NC}"; }
log_error()   { echo -e "${RED}  ❌ $*${NC}"; }

# ── Config ────────────────────────────────────────────────────────────────────
IMAGE="${1:?Usage: deploy.sh <IMAGE> <TAG>}"
TAG="${2:-latest}"
export API_IMAGE="${IMAGE}:${TAG}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}"
ENV_FILE="${DEPLOY_DIR}/.env"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.yml"

CONTAINER_NAME="ecommerce-api"
SHADOW_NAME="ecommerce-api-shadow"
MIGRATE_NAME="ecommerce-api-migrate"
APP_PORT=3001
SHADOW_PORT=3099
HEALTH_URL="http://localhost:${SHADOW_PORT}/health"

MAX_RETRIES=12      # 12 × 5s = 60s max wait
RETRY_INTERVAL=5

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  🚀 E-Commerce API — Hybrid Blue-Green Deployment${NC}"
echo -e "${CYAN}  Image : ${API_IMAGE}${NC}"
echo -e "${CYAN}  Time  : $(date)${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 0. Pre-flight checks
# ─────────────────────────────────────────────────────────────────────────────
log_info "[0/7] Pre-flight checks..."

if [ ! -f "${ENV_FILE}" ]; then
  log_error ".env not found at ${ENV_FILE} — aborting!"
  exit 1
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
  log_error "docker-compose.yml not found at ${COMPOSE_FILE} — aborting!"
  exit 1
fi

if ! docker info &>/dev/null; then
  log_error "Docker daemon is not running — aborting!"
  exit 1
fi

log_success "Pre-flight checks passed"

# ─────────────────────────────────────────────────────────────────────────────
# 1. Pre-cleanup
# ─────────────────────────────────────────────────────────────────────────────
log_info "[1/7] Pre-deploy cleanup..."

docker container prune -f                          >/dev/null 2>&1 || true
docker image prune -af --filter "until=168h"       >/dev/null 2>&1 || true

log_success "Cleanup done"

# ─────────────────────────────────────────────────────────────────────────────
# 2. Pull the new image
# ─────────────────────────────────────────────────────────────────────────────
log_info "[2/7] Pulling ${API_IMAGE}..."

if ! docker pull "${API_IMAGE}"; then
  log_error "Failed to pull image — aborting! Old container untouched."
  exit 1
fi

log_success "Image pulled"

# ─────────────────────────────────────────────────────────────────────────────
# 3. Run DB Migrations
# ─────────────────────────────────────────────────────────────────────────────
log_info "[3/7] Running Prisma migrations in temp container..."

docker stop  "${MIGRATE_NAME}" 2>/dev/null || true
docker rm    "${MIGRATE_NAME}" 2>/dev/null || true

if ! docker run --rm \
  --name  "${MIGRATE_NAME}" \
  --env-file "${ENV_FILE}" \
  -e NODE_ENV=production \
  "${API_IMAGE}" \
  ./apps/api/node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma; then
  log_error "Migrations FAILED — aborting deployment. Old container is still live."
  exit 1
fi

log_success "Migrations applied successfully"

# ─────────────────────────────────────────────────────────────────────────────
# 4. Start shadow container for visual healthcheck test
# ─────────────────────────────────────────────────────────────────────────────
log_info "[4/7] Starting shadow container on port ${SHADOW_PORT}..."

docker stop "${SHADOW_NAME}" 2>/dev/null || true
docker rm   "${SHADOW_NAME}" 2>/dev/null || true

docker run -d \
  --name "${SHADOW_NAME}" \
  --env-file "${ENV_FILE}" \
  -e NODE_ENV=production \
  -e PORT="${APP_PORT}" \
  -p "127.0.0.1:${SHADOW_PORT}:${APP_PORT}" \
  --restart no \
  "${API_IMAGE}"

log_success "Shadow container started"

# ─────────────────────────────────────────────────────────────────────────────
# 5. Health check shadow container
# ─────────────────────────────────────────────────────────────────────────────
log_info "[5/7] Health checking shadow (max ${MAX_RETRIES}×${RETRY_INTERVAL}s = $((MAX_RETRIES * RETRY_INTERVAL))s)..."

HEALTHY=false
for i in $(seq 1 "${MAX_RETRIES}"); do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_URL}" 2>/dev/null || echo "000")
  log_info "  Attempt ${i}/${MAX_RETRIES} — HTTP ${HTTP_STATUS} ← ${HEALTH_URL}"

  if [[ "${HTTP_STATUS}" =~ ^2 ]]; then
    HEALTHY=true
    log_success "Health check passed on attempt ${i}!"
    break
  fi

  sleep "${RETRY_INTERVAL}"
done

# ── Auto-rollback: health check failed ───────────────────────────────────────
if [ "${HEALTHY}" = false ]; then
  log_error "Health check failed!"
  echo ""
  log_warn "Shadow container logs:"
  docker logs --tail=50 "${SHADOW_NAME}" || true
  docker stop "${SHADOW_NAME}" 2>/dev/null || true
  docker rm   "${SHADOW_NAME}" 2>/dev/null || true
  log_error "Deployment ABORTED — old container is still live."
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# 6. Cut over utilizing docker-compose safely
# ─────────────────────────────────────────────────────────────────────────────
log_info "[6/7] Cutting over using docker-compose..."

# Stop shadow container correctly releasing the lock
docker stop "${SHADOW_NAME}" 2>/dev/null || true
docker rm "${SHADOW_NAME}" 2>/dev/null || true

# Boot the new container directly through Compose!
# Using docker-compose ensures the correct memory configs, limits, and restart policies from the YML apply.
docker compose -f "${COMPOSE_FILE}" up -d api

log_success "New container is live via docker-compose"

# ─────────────────────────────────────────────────────────────────────────────
# 7. Success summary
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Deployment Successful! — $(date)${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo ""
docker compose -f "${COMPOSE_FILE}" ps
echo ""
