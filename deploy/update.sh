#!/usr/bin/env bash
# =============================================================================
# Helios AI SOC – Quick Update Script
# Re-syncs files, rebuilds the Docker image, and reloads nginx.
#
# Usage:  sudo bash deploy/update.sh
# =============================================================================
set -euo pipefail

APP_DIR="/opt/helios-soc"
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"

GREEN='\033[0;32m'; NC='\033[0m'
info() { echo -e "${GREEN}[INFO]${NC}  $*"; }

[[ $EUID -ne 0 ]] && echo "Run as root:  sudo bash deploy/update.sh" && exit 1

info "Syncing application files to ${APP_DIR}..."
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' \
  "${SRC_DIR}/" "${APP_DIR}/"

info "Rebuilding and restarting container..."
cd "${APP_DIR}"
docker compose up --build -d

info "Reloading host nginx..."
nginx -t && nginx -s reload

info "Done. Container status:"
docker compose ps
