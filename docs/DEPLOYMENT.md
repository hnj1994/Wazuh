# Deployment Guide

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

Use mock mode until your backend gateway is ready:

```env
VITE_USE_MOCKS=true
```

## Production Build

```bash
npm run typecheck
npm run build
npm run preview
```

The production artifact is generated in `dist/`.

## Docker Deployment

```bash
docker compose up --build -d
```

For real integrations:

```bash
VITE_USE_MOCKS=false \
SOC_API_UPSTREAM=http://your-soc-api:8081 \
docker compose up --build -d
```

## Reverse Proxy

Terminate TLS at nginx, Caddy, Traefik, or your load balancer.

Required paths:

- `/` serves the React SPA.
- `/api/` proxies REST calls to the backend gateway.
- `/ws/` proxies WebSocket live alert streams.

## Environment Variables

```env
VITE_USE_MOCKS=false
VITE_WAZUH_PROXY_PATH=/api/wazuh
VITE_OPENSEARCH_PROXY_PATH=/api/opensearch
VITE_OLLAMA_PROXY_PATH=/api/ollama
VITE_WAZUH_WS_URL=/ws/alerts
VITE_OLLAMA_MODEL=llama3.1:8b
```

Vite variables are compiled into the frontend bundle. Do not put secrets in `VITE_*` variables.

## Hardening Checklist

- Enable OIDC/SAML auth and disable demo credentials.
- Enforce RBAC in the backend, not only in the UI.
- Add CSP, HSTS, secure cookies, and CSRF protection for session routes.
- Put Wazuh/OpenSearch/Ollama on private networks.
- Restrict OpenSearch queries with allow-listed indices and time ranges.
- Add audit logs for hunts, chat prompts, report generation, and SOAR actions.
- Use queues for long-running reports and AI jobs.
- Add observability for API latency, model latency, failed queries, and WebSocket drops.

## Future Enhancements

- Case management persistence with comments and evidence attachments.
- Detection-as-code editor with Sigma/YARA/Suricata rule management.
- LLM tool calling for controlled searches and playbook execution.
- Entity graph for users, hosts, IPs, processes, and incidents.
- Timeline diffing across similar incidents.
- Saved dashboards per tenant and per analyst role.
- Model evaluation suite for SOC prompt quality and hallucination checks.
