#!/usr/bin/env bash
# =============================================================================
# Helios AI SOC – Full Deployment Script
# Azure VM: 4.188.228.167 | Ubuntu 22.04 LTS
#
# Usage:
#   git clone <repo> /opt/helios-soc-src
#   cd /opt/helios-soc-src
#   sudo bash deploy/deploy.sh
# =============================================================================
set -euo pipefail

PUBLIC_IP="4.188.228.167"
APP_DIR="/opt/helios-soc"          # runtime directory (env + compose)
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"   # repo root
NGINX_CONF="/etc/nginx/sites-available/helios-soc"
SSL_DIR="/etc/nginx/ssl"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && error "Run as root:  sudo bash deploy/deploy.sh"

# ── 1. System packages ────────────────────────────────────────────────────────
info "Updating package index..."
apt-get update -qq

for pkg in curl wget git nginx openssl rsync; do
  dpkg -l "$pkg" &>/dev/null || apt-get install -y -qq "$pkg"
done

# ── 2. Docker ─────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Installing Docker..."
  curl -fsSL https://get.docker.com | bash
  systemctl enable --now docker
  info "Docker installed: $(docker --version)"
else
  info "Docker already present: $(docker --version)"
fi

# Ensure docker compose (v2 plugin) is available
if ! docker compose version &>/dev/null 2>&1; then
  info "Installing Docker Compose plugin..."
  apt-get install -y -qq docker-compose-plugin
fi

# ── 3. Copy application to runtime directory ──────────────────────────────────
info "Syncing application files to ${APP_DIR}..."
mkdir -p "${APP_DIR}"
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' \
  "${SRC_DIR}/" "${APP_DIR}/"

# ── 4. Environment file ───────────────────────────────────────────────────────
if [[ ! -f "${APP_DIR}/.env" ]]; then
  info "Creating .env from .env.example..."
  cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"
  warn "════════════════════════════════════════════════════"
  warn "  IMPORTANT: edit ${APP_DIR}/.env now!"
  warn "  Key settings:"
  warn "    OPENSEARCH_BASIC_AUTH = base64 of your OpenSearch admin:password"
  warn "    WAZUH_BASE_URL        = https://host.docker.internal:55000 (default)"
  warn "    VITE_USE_MOCKS        = false for live data, true for demo data"
  warn "════════════════════════════════════════════════════"
  warn "Press Enter to continue (Ctrl+C to edit .env first)..."
  read -r
else
  info ".env already exists – skipping (delete it to regenerate from example)"
fi

# ── 5. Self-signed TLS certificate ────────────────────────────────────────────
mkdir -p "${SSL_DIR}"
if [[ ! -f "${SSL_DIR}/helios-soc.crt" ]]; then
  info "Generating self-signed TLS certificate for ${PUBLIC_IP}..."
  openssl req -x509 -nodes -days 730 -newkey rsa:2048 \
    -keyout "${SSL_DIR}/helios-soc.key" \
    -out    "${SSL_DIR}/helios-soc.crt" \
    -subj   "/CN=${PUBLIC_IP}/O=Helios AI SOC/C=US" \
    -addext "subjectAltName=IP:${PUBLIC_IP}"
  chmod 600 "${SSL_DIR}/helios-soc.key"
  info "Certificate created:  ${SSL_DIR}/helios-soc.crt  (valid 2 years)"
else
  info "TLS certificate already exists – skipping generation"
fi

# ── 6. Host nginx configuration ───────────────────────────────────────────────
info "Installing host nginx configuration..."
cp "${SRC_DIR}/deploy/nginx-host.conf" "${NGINX_CONF}"
ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/helios-soc
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable --now nginx
nginx -s reload
info "Host nginx configured and running"

# ── 7. Build and start Docker container ───────────────────────────────────────
info "Building Docker image (this may take a few minutes)..."
cd "${APP_DIR}"
docker compose down --remove-orphans 2>/dev/null || true
docker compose up --build -d
info "Container started"

# Wait for health check (up to 60 s)
info "Waiting for health check..."
CONTAINER_ID=$(docker compose ps -q helios-soc 2>/dev/null || true)
for i in $(seq 1 12); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${CONTAINER_ID}" 2>/dev/null || echo "starting")
  if [[ "${STATUS}" == "healthy" ]]; then
    info "Container is healthy"
    break
  fi
  echo -n "."
  sleep 5
done
echo ""

# ── 8. Reload nginx after container is up ─────────────────────────────────────
nginx -s reload

# ── 9. UFW firewall ───────────────────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  info "Configuring UFW firewall..."
  ufw --force enable
  ufw allow 22/tcp   comment "SSH"
  ufw allow 80/tcp   comment "HTTP (redirect to HTTPS)"
  ufw allow 443/tcp  comment "HTTPS – Helios AI SOC"
  # Internal services MUST NOT be exposed externally
  ufw deny  55000    comment "Wazuh API – loopback only"
  ufw deny  9200     comment "OpenSearch – loopback only"
  ufw deny  11434    comment "Ollama – loopback only"
  ufw deny  8080     comment "Docker container – behind nginx only"
  ufw status verbose
fi

# ── 10. Summary ───────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Helios AI SOC deployed successfully!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 Application:  https://${PUBLIC_IP}"
echo -e "  💊 Health check: https://${PUBLIC_IP}/health"
echo -e "  📁 App dir:      ${APP_DIR}"
echo -e "  🔑 TLS cert:     ${SSL_DIR}/helios-soc.crt"
echo -e "  ⚙️  Config:       ${APP_DIR}/.env"
echo ""
echo -e "  Useful commands:"
echo -e "    Logs:    docker compose -f ${APP_DIR}/docker-compose.yml logs -f"
echo -e "    Restart: docker compose -f ${APP_DIR}/docker-compose.yml restart"
echo -e "    Stop:    docker compose -f ${APP_DIR}/docker-compose.yml down"
echo -e "    Update:  sudo bash ${SRC_DIR}/deploy/update.sh"
echo ""
warn "⚠  Self-signed certificate – browsers will show a security warning."
warn "   Accept the warning, or add a domain name and run:"
warn "   sudo apt install certbot python3-certbot-nginx"
warn "   sudo certbot --nginx -d your-domain.com"
echo ""
