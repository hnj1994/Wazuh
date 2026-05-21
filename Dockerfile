# ── Build stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

# Build-time args – compiled into the JS bundle (no secrets here)
ARG VITE_APP_NAME="Helios AI SOC"
ARG VITE_USE_MOCKS=false
ARG VITE_WAZUH_PROXY_PATH=/api/wazuh
ARG VITE_OPENSEARCH_PROXY_PATH=/api/opensearch
ARG VITE_OLLAMA_PROXY_PATH=/api/ollama
ARG VITE_WAZUH_WS_URL=
ARG VITE_OLLAMA_MODEL=llama3.1:8b
ARG VITE_DEFAULT_TENANT=apex

ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_USE_MOCKS=$VITE_USE_MOCKS \
    VITE_WAZUH_PROXY_PATH=$VITE_WAZUH_PROXY_PATH \
    VITE_OPENSEARCH_PROXY_PATH=$VITE_OPENSEARCH_PROXY_PATH \
    VITE_OLLAMA_PROXY_PATH=$VITE_OLLAMA_PROXY_PATH \
    VITE_WAZUH_WS_URL=$VITE_WAZUH_WS_URL \
    VITE_OLLAMA_MODEL=$VITE_OLLAMA_MODEL \
    VITE_DEFAULT_TENANT=$VITE_DEFAULT_TENANT

RUN npm run build

# ── Production image ─────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Default runtime env vars for the nginx.conf.template (overridden by docker-compose)
ENV SOC_API_UPSTREAM=http://host.docker.internal:3001 \
    WAZUH_BASE_URL=https://host.docker.internal:55000 \
    OPENSEARCH_BASE_URL=https://host.docker.internal:9200 \
    OLLAMA_BASE_URL=http://host.docker.internal:11434 \
    OPENSEARCH_BASIC_AUTH=YWRtaW46YWRtaW4=

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx:alpine ships with wget; use it for the health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -q --spider http://localhost/health || exit 1

EXPOSE 80
