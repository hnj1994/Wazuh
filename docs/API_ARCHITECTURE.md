# Backend API Architecture

## Recommended Services

Use a small backend-for-frontend service rather than connecting React directly to Wazuh, OpenSearch, or Ollama.

Core responsibilities:

- Authenticate users with OIDC/SAML and issue short-lived app sessions.
- Enforce tenant scoping on every request.
- Map RBAC permissions to Wazuh/OpenSearch/Ollama capabilities.
- Store API credentials in a secret manager.
- Normalize alerts into the frontend `Alert` contract.
- Audit every search, alert action, report generation, and SOAR execution.

## Suggested Endpoints

```text
POST /auth/login
GET  /me
GET  /tenants

GET  /api/wazuh/agents
GET  /api/wazuh/agents/:id/syscollector
GET  /api/wazuh/agents/:id/vulnerabilities

POST /api/opensearch/alerts/search
POST /api/opensearch/hunt
GET  /api/opensearch/alerts/:id

POST /api/ollama/chat
POST /api/ollama/alerts/:id/summary
POST /api/ollama/incidents/:id/timeline

GET  /api/incidents
PATCH /api/incidents/:id
POST /api/reports
GET  /api/threat-intel/enrich
POST /api/soar/playbooks/:id/run

GET  /ws/alerts
```

## Data Flow

```text
React UI -> API Gateway/BFF -> Wazuh API
React UI -> API Gateway/BFF -> OpenSearch
React UI -> API Gateway/BFF -> Ollama
React UI <- WebSocket <- API Gateway/BFF <- alert stream
```

## Multi-Tenant Controls

- Attach `tenant_id` to every user session.
- Maintain tenant-to-index-pattern mappings server-side.
- Never accept tenant index names directly from the browser.
- Add OpenSearch document-level filters for tenant, agent group, and index prefix.
- Return only normalized fields required by the UI.

## Ollama Guardrails

- Inject a system prompt that identifies the user role and tenant.
- Add selected alert, incident, and search-result context server-side.
- Redact secrets, tokens, passwords, and patient/customer identifiers.
- Set model, context length, and temperature centrally.
- Store prompt and response audit logs for regulated environments.

## SOAR Integration

The UI currently simulates playbook execution. In production, connect the BFF to:

- Wazuh active response
- Shuffle, StackStorm, n8n, TheHive, Cortex, or custom webhooks
- Ticketing systems such as Jira, ServiceNow, or Linear
- Notification targets such as Slack, Teams, or email
- Firewall, EDR, IAM, and cloud containment APIs
