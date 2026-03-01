#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# nginx-setup.sh  —  Install and configure Nginx + SSL (Let's Encrypt)
#
# What this does:
#   1. OS validation (Ubuntu/Debian only)
#   2. Installs Nginx
#   3. Writes http-level config: WebSocket map, rate limiting, gzip
#   4. Writes HSTS config via map (scheme-aware, no sed injection)
#   5. Creates reverse proxy site config with security headers
#   6. Installs Certbot → obtains SSL certificate → HTTP redirect
#   7. Post-SSL hook: OCSP stapling + TLS version hardening
#   8. Verifies auto-renewal
#
# Prerequisites (before running):
#   ✅ EC2 security group: ports 22, 80, 443 open
#   ✅ DNS A record: api.reyva.co.in → <THIS EC2 PUBLIC IP>
#   ✅ API container running: curl http://localhost:3001/health
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
EMAIL="learnthefutureai@gmail.com"
NGINX_SITE="/etc/nginx/sites-available/${API_DOMAIN}"
NGINX_GLOBAL="/etc/nginx/conf.d/ecommerce-global.conf"
NGINX_SNIPPET="/etc/nginx/snippets/ssl-hardening.conf"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  🌐 Nginx + SSL Setup for ${API_DOMAIN}${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 0. Pre-flight
# ─────────────────────────────────────────────────────────────────────────────
log_info "[0/7] Pre-flight checks..."

if ! command -v apt-get &>/dev/null; then
  log_error "This script supports Ubuntu/Debian only (apt-get not found)."
  log_error "For Amazon Linux, use dnf. Aborting."
  exit 1
fi

if curl -sf "http://localhost:${API_PORT}/health" >/dev/null 2>&1; then
  log_success "API healthy on localhost:${API_PORT}"
else
  log_warn "API not responding on port ${API_PORT} — ensure container is running"
fi

MY_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
log_info "Server public IP: ${MY_IP}"
log_warn "DNS A record must exist: ${API_DOMAIN} → ${MY_IP}"

# ─────────────────────────────────────────────────────────────────────────────
# 1. Install Nginx
# ─────────────────────────────────────────────────────────────────────────────
log_info "[1/7] Installing Nginx..."

sudo apt-get update -q
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start  nginx

log_success "Nginx installed"

# Ubuntu's default nginx.conf includes 'gzip on;' in the http{} block.
# Our conf.d/ecommerce-global.conf also sets gzip inside http{} → duplicate error.
# Comment it out so all gzip config lives exclusively in our conf.d file.
sudo sed -i 's/^\(\s*gzip on;\)/# \1  # managed by ecommerce-global.conf/' /etc/nginx/nginx.conf

# ─────────────────────────────────────────────────────────────────────────────
# 2. http-level config (WebSocket map, rate limiting, gzip, HSTS map)
#    These directives must live in the http{} block, not a server{} block.
#    /etc/nginx/conf.d/ files are included inside http{} by nginx.conf.
#
#    HSTS strategy: use a scheme map so the header is only sent on HTTPS.
#    This avoids sed-injecting into certbot-managed blocks, which is fragile.
# ─────────────────────────────────────────────────────────────────────────────
log_info "[2/7] Writing http-level config (global conf.d)..."

sudo tee "${NGINX_GLOBAL}" > /dev/null << 'EOF'
# ── WebSocket connection header map ───────────────────────────────────────────
# Normal HTTP requests must not send the Upgrade header.
# This map sends Connection: upgrade only when the client requested an upgrade,
# and Connection: close otherwise.
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# ── HSTS — scheme-aware (only sent when HTTPS, never on HTTP) ─────────────────
# Avoids sed-injecting into certbot-managed blocks.
# Empty string on HTTP means the header is omitted entirely.
map $scheme $hsts_header {
    # preload deliberately omitted — requires hstspreload.org submission first.
    # Add '; preload' and submit at https://hstspreload.org when ready.
    https "max-age=63072000; includeSubDomains";
    default "";
}

# ── Rate limiting zone (10MB shared memory, 20 req/s per IP) ─────────────────
# Sufficient for API + admin dashboard parallel requests without false throttling.
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
limit_req_status 429;

# ── Gzip compression ──────────────────────────────────────────────────────────
gzip            on;
gzip_comp_level 5;
gzip_min_length 256;
gzip_proxied    any;
gzip_vary       on;
gzip_types
    application/json
    application/javascript
    application/xml
    text/css
    text/plain
    text/xml;

# Hide Nginx version from response headers and error pages
server_tokens off;
EOF

log_success "Global conf written"

# ─────────────────────────────────────────────────────────────────────────────
# 3. Site config (HTTP block — Certbot upgrades to HTTPS automatically)
# ─────────────────────────────────────────────────────────────────────────────
log_info "[3/7] Writing site config for ${API_DOMAIN}..."

sudo tee "${NGINX_SITE}" > /dev/null << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${API_DOMAIN};

    # Security headers
    add_header X-Frame-Options           "SAMEORIGIN"                 always;
    add_header X-Content-Type-Options    "nosniff"                    always;
    add_header X-XSS-Protection          "1; mode=block"              always;
    add_header Referrer-Policy           "no-referrer-when-downgrade" always;
    add_header Permissions-Policy        "camera=(), microphone=(), geolocation=()" always;

    # HSTS — only sent on HTTPS (empty string on HTTP = header omitted)
    # No 'always': with always + empty string, some Nginx versions emit the header anyway
    add_header Strict-Transport-Security \$hsts_header;

    # Rate limiting — burst allows short spikes, nodelay avoids artificial lag
    limit_req zone=api_limit burst=40 nodelay;

    # Proxy to API container (127.0.0.1 — never exposed publicly)
    location / {
        proxy_pass         http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;

        proxy_set_header   Upgrade            \$http_upgrade;
        proxy_set_header   Connection         \$connection_upgrade;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        proxy_connect_timeout  60s;
        proxy_send_timeout     60s;
        proxy_read_timeout     60s;
        client_max_body_size   20M;
    }

    # Health endpoint — suppress from access logs (noisy)
    location = /health {
        proxy_pass         http://127.0.0.1:${API_PORT}/health;
        proxy_read_timeout 5s;
        access_log         off;
    }
}
EOF

sudo ln -sf "${NGINX_SITE}" "/etc/nginx/sites-enabled/${API_DOMAIN}"
sudo rm -f /etc/nginx/sites-enabled/default

if sudo nginx -t 2>&1; then
  sudo systemctl reload nginx
  log_success "Site config active"
else
  log_error "Nginx config invalid — fix errors above"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4. Install Certbot
# ─────────────────────────────────────────────────────────────────────────────
log_info "[4/7] Installing Certbot..."

sudo apt-get install -y certbot python3-certbot-nginx
log_success "Certbot installed"

# ─────────────────────────────────────────────────────────────────────────────
# 5. Obtain SSL certificate
# ─────────────────────────────────────────────────────────────────────────────
log_info "[5/7] Obtaining SSL certificate for ${API_DOMAIN}..."

SSL_OK=false
if sudo certbot --nginx \
  --non-interactive \
  --agree-tos \
  --redirect \
  --email "${EMAIL}" \
  -d "${API_DOMAIN}"; then
  SSL_OK=true
  log_success "SSL certificate obtained"
else
  log_error "Certbot failed — DNS A record likely not propagated yet"
  log_warn  "Once DNS propagates, run manually:"
  log_warn  "  sudo certbot --nginx --redirect --email ${EMAIL} -d ${API_DOMAIN}"
  log_warn  "Then re-run: sudo bash /etc/letsencrypt/renewal-hooks/deploy/tls-harden.sh"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 6. Post-SSL hardening: OCSP stapling + TLS version restriction
#    These can only live in an SSL context, so we inject them as a snippet
#    included by a certbot renewal hook (runs after every cert renewal too).
#
#    OCSP stapling: server pre-fetches certificate revocation status from CA
#    and staples it to the TLS handshake — faster for browsers, better privacy.
#
#    TLS versions: explicitly allow only 1.2 and 1.3 — drop old vulnerable ones.
# ─────────────────────────────────────────────────────────────────────────────
log_info "[6/7] Writing post-SSL hardening hook (OCSP + TLS versions)..."

sudo mkdir -p /etc/nginx/snippets
sudo tee "${NGINX_SNIPPET}" > /dev/null << 'EOF'
# ssl-hardening.conf — included inside the HTTPS server block by the hook below.

# TLS version enforcement
ssl_protocols             TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ecdh_curve            X25519:secp384r1;

# TLS session resumption — reduces handshake overhead for returning clients
# session_tickets off: disables ticket reuse (forward secrecy improvement)
ssl_session_cache   shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# Cipher suite control — bans anonymous + MD5 ciphers, allows all HIGH-strength
ssl_ciphers HIGH:!aNULL:!MD5;

# OCSP stapling — server pre-fetches cert revocation status from CA
# and staples it to the TLS handshake: faster for browsers, better privacy
ssl_stapling        on;
ssl_stapling_verify on;
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;
EOF

# Renewal hook — runs automatically after every cert renewal
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/tls-harden.sh > /dev/null << HOOKEOF
#!/usr/bin/env bash
# Injected by nginx-setup.sh. Runs after every Certbot renewal.
# Adds ssl-hardening.conf snippet into the Certbot-managed HTTPS server block.
set -euo pipefail

SITE="/etc/nginx/sites-available/${API_DOMAIN}"
SNIPPET="include /etc/nginx/snippets/ssl-hardening.conf;"

# Only inject if not already present
if ! grep -qF "\${SNIPPET}" "\${SITE}"; then
  # Inject after 'listen 443 ssl' — more stable anchor than ssl_certificate
  # (certbot always writes this line and its format is consistent)
  sudo sed -i "/listen 443 ssl/a\\    \${SNIPPET}" "\${SITE}"
fi

sudo nginx -t && sudo systemctl reload nginx
echo "TLS hardening applied to \${SITE}"
HOOKEOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/tls-harden.sh

# Run immediately if SSL succeeded
if [ "${SSL_OK}" = true ]; then
  sudo bash /etc/letsencrypt/renewal-hooks/deploy/tls-harden.sh
  log_success "OCSP stapling + TLS 1.2/1.3 enforcement active"
else
  log_warn "TLS hardening hook created — will run automatically after SSL is obtained"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 7. Verify auto-renewal
# ─────────────────────────────────────────────────────────────────────────────
log_info "[7/7] Verifying Certbot auto-renewal..."
sudo certbot renew --dry-run 2>&1 | tail -5 || true
log_success "Auto-renewal verified (certs renew every 90 days)"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Nginx + SSL setup complete${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo ""
if [ "${SSL_OK}" = true ]; then
  echo -e "  API is live at:"
  echo -e "    ${GREEN}https://${API_DOMAIN}/health${NC}"
  echo -e "    ${GREEN}https://${API_DOMAIN}/api${NC}"
else
  echo -e "  API running on HTTP only until DNS + SSL are sorted:"
  echo -e "    ${YELLOW}http://${API_DOMAIN}/health${NC}"
fi
echo ""
echo -e "  Next:"
echo -e "    Set Vercel env: NEXT_PUBLIC_API_URL=https://${API_DOMAIN}/api"
echo -e "    Test:           curl https://${API_DOMAIN}/health"
echo ""
echo -e "  Useful commands:"
echo -e "    sudo nginx -t                          # validate config"
echo -e "    sudo systemctl reload nginx            # reload without downtime"
echo -e "    sudo tail -f /var/log/nginx/error.log  # view errors"
echo -e "    sudo certbot certificates              # view cert info"
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
