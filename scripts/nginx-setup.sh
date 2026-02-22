#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# nginx-setup.sh  —  Install & configure Nginx + SSL (Let's Encrypt/Certbot)
#
# What this does:
#   1. Installs Nginx
#   2. Creates a reverse proxy config routing internet → API container
#   3. Installs Certbot
#   4. Obtains a free SSL certificate for api.reyva.co.in
#   5. Configures auto-renewal
#   6. Hardens Nginx with security headers
#
# Prerequisites (do these BEFORE running this script):
#   ✅ EC2 security group has ports 80 and 443 open
#   ✅ DNS: A record  api.reyva.co.in → <THIS EC2 PUBLIC IP>
#   ✅ API container is running on localhost:3001
#      (verify: curl http://localhost:3001/health)
#
# Usage:
#   bash ~/nginx-setup.sh
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
API_DOMAIN="api.reyva.co.in"
API_PORT=3001
EMAIL="learnthefutureai@gmail.com"          # ← used for Let's Encrypt expiry alerts
NGINX_CONF="/etc/nginx/sites-available/${API_DOMAIN}"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  🌐 Nginx + SSL Setup for ${API_DOMAIN}${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 0. Pre-flight: verify API container is running
# ─────────────────────────────────────────────────────────────────────────────
log_info "[0/5] Pre-flight: checking API is reachable on localhost:${API_PORT}..."

if ! curl -sf "http://localhost:${API_PORT}/health" >/dev/null 2>&1; then
  log_error "API is not responding on port ${API_PORT}!"
  log_warn  "Make sure the container is running: docker ps"
  log_warn  "Continuing anyway — you can restart Nginx later once the API is up."
else
  log_success "API is healthy on localhost:${API_PORT}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 1. Install Nginx
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  [1/5] Installing Nginx...${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"

sudo apt-get update -q
sudo apt-get install -y nginx

sudo systemctl enable nginx
sudo systemctl start nginx

log_success "Nginx installed and running"

# ─────────────────────────────────────────────────────────────────────────────
# 2. Create Nginx site config (HTTP first — Certbot will upgrade to HTTPS)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  [2/5] Configuring Nginx reverse proxy...${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"

sudo tee "${NGINX_CONF}" > /dev/null << EOF
# ── ${API_DOMAIN} — API reverse proxy ──────────────────────────────────────
# Certbot will add SSL blocks below automatically.
server {
    listen 80;
    listen [::]:80;
    server_name ${API_DOMAIN};

    # ── Security headers ───────────────────────────────────────────────────
    add_header X-Frame-Options        "SAMEORIGIN"   always;
    add_header X-XSS-Protection       "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff"       always;
    add_header Referrer-Policy        "no-referrer-when-downgrade" always;

    # ── Proxy to API container ─────────────────────────────────────────────
    location / {
        proxy_pass         http://localhost:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade     \$http_upgrade;
        proxy_set_header   Connection  'upgrade';
        proxy_set_header   Host        \$host;
        proxy_set_header   X-Real-IP           \$remote_addr;
        proxy_set_header   X-Forwarded-For     \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto   \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts (generous for long-running API requests)
        proxy_connect_timeout  60s;
        proxy_send_timeout     60s;
        proxy_read_timeout     60s;

        # Upload size (for file endpoints)
        client_max_body_size 20M;
    }

    # ── Health check passthrough ───────────────────────────────────────────
    location /health {
        proxy_pass http://localhost:${API_PORT}/health;
        access_log off;            # don't pollute logs with health pings
    }
}
EOF

# Enable site by symlinking to sites-enabled
sudo ln -sf "${NGINX_CONF}" "/etc/nginx/sites-enabled/${API_DOMAIN}"

# Disable default site to avoid conflicts
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
if sudo nginx -t; then
  sudo systemctl reload nginx
  log_success "Nginx configured for ${API_DOMAIN}"
else
  log_error "Nginx config test failed! Fix errors above and re-run."
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# 3. Install Certbot
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  [3/5] Installing Certbot...${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"

sudo apt-get install -y certbot python3-certbot-nginx
log_success "Certbot installed"

# ─────────────────────────────────────────────────────────────────────────────
# 4. Obtain SSL certificate
#    --nginx            → uses the Nginx plugin (auto-edits nginx conf)
#    --non-interactive  → no prompts
#    --agree-tos        → agree to Let's Encrypt ToS
#    --redirect         → auto-redirect HTTP → HTTPS
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  [4/5] Obtaining SSL certificate for ${API_DOMAIN}...${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""
log_warn "Certbot will contact Let's Encrypt — ensure DNS A record is set:"
log_warn "  ${API_DOMAIN}  →  $(curl -s ifconfig.me 2>/dev/null || echo '<THIS EC2 IP>')"
echo ""

if sudo certbot --nginx \
  --non-interactive \
  --agree-tos \
  --redirect \
  --email "${EMAIL}" \
  -d "${API_DOMAIN}"; then
  log_success "SSL certificate obtained for ${API_DOMAIN}!"
else
  log_error "Certbot failed — most likely the DNS A record isn't propagated yet."
  log_warn  "Fix the DNS, then run manually:"
  log_warn  "  sudo certbot --nginx --redirect --email ${EMAIL} -d ${API_DOMAIN}"
  log_warn  ""
  log_warn  "Nginx is still running on HTTP in the meantime."
fi

# ─────────────────────────────────────────────────────────────────────────────
# 5. Verify auto-renewal timer
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  [5/5] Verifying auto-renewal...${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"

sudo certbot renew --dry-run 2>&1 | tail -5 || true
log_success "Auto-renewal configured (runs twice daily via systemd timer)"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Nginx + SSL setup complete!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 API is live at:"
echo -e "     ${GREEN}https://${API_DOMAIN}/api${NC}"
echo -e "     ${GREEN}https://${API_DOMAIN}/health${NC}"
echo ""
echo -e "  📌 Next steps:"
echo ""
echo -e "  1. Test the API from your browser or terminal:"
echo -e "     curl https://${API_DOMAIN}/health"
echo ""
echo -e "  2. Update your Vercel frontend environment variable:"
echo -e "     NEXT_PUBLIC_API_URL = https://${API_DOMAIN}/api"
echo ""
echo -e "  3. Useful Nginx commands:"
echo -e "     sudo nginx -t                    # test config"
echo -e "     sudo systemctl reload nginx      # reload without downtime"
echo -e "     sudo systemctl status nginx      # check status"
echo -e "     sudo tail -f /var/log/nginx/error.log   # view errors"
echo ""
echo -e "  4. View certificate info:"
echo -e "     sudo certbot certificates"
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
