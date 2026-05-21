<<<<<<< HEAD
# Helios AI SOC

Self-hosted AI-powered SOC frontend for Wazuh, OpenSearch, and Ollama. The app is a complete React + TypeScript platform with dashboarding, live alerts, AI copilot chat, threat hunting, MITRE ATT&CK mapping, incident workflows, SOAR simulation, reporting, tenant switching, RBAC, dark/light mode, and realistic demo data.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

Demo credentials:

- `admin@soc.local` / `admin123`
- `analyst@soc.local` / `analyst123`
- `viewer@soc.local` / `viewer123`

This repository was generated in mock mode by default, so it runs before your backend gateway is available.

## Folder Structure

```text
src/
  components/         Reusable layout, chat, dashboard, and shadcn-style UI primitives
  data/               Realistic multi-tenant SOC demo data
  hooks/              Theme and WebSocket lifecycle hooks
  lib/                RBAC, query translation, formatting, utility helpers
  pages/              Dashboard, alerts, hunt, MITRE, incidents, SOAR, reports, agents, admin
  services/
    api/              Wazuh, OpenSearch, Ollama, mock API adapters
    correlation/      Alert correlation engine
    websocket/        Live alert stream client
  store/              Zustand auth, SOC data, and UI stores
  types/              Shared SOC domain types
```

## Integration Mode

Frontend browsers should not hold Wazuh, OpenSearch, or Ollama credentials. In production, put a backend-for-frontend API gateway between this React app and your SOC stack.

Recommended routes:

- `GET /api/wazuh/agents` -> Wazuh API
- `POST /api/opensearch/wazuh-alerts-*/_search` -> OpenSearch
- `POST /api/ollama/api/chat` -> Ollama
- `GET /ws/alerts` -> backend WebSocket fan-out of new alerts

Set `VITE_USE_MOCKS=false` once those proxy routes are available.

## Key Workflows

Ollama workflow:

1. Analyst asks a question in SOC Copilot.
2. UI sends chat messages and selected alert context to `/api/ollama/api/chat`.
3. Backend injects tenant guardrails and redacts secrets.
4. Ollama returns concise analyst guidance, MITRE context, and next actions.

Wazuh workflow:

1. Wazuh agents send telemetry to Wazuh manager.
2. Alerts are indexed into OpenSearch.
3. Wazuh API provides agents, vulnerabilities, syscollector, and manager metadata.
4. Frontend renders agent health and alert drill-down through the backend proxy.

OpenSearch workflow:

1. Hunt queries are translated into Lucene or OpenSearch DSL.
2. Backend validates tenant scope and allowed index patterns.
3. OpenSearch returns normalized alert/event documents.
4. UI correlates activity into incidents and MITRE coverage.

Real-time streaming:

1. Backend subscribes to OpenSearch alert index changes, Wazuh socket output, or a queue.
2. Backend normalizes alerts and sends tenant-scoped events over WebSocket.
3. UI appends alerts into the live queue and dashboard state.

## Docker

```bash
docker compose up --build
```

The frontend is served by nginx on `http://localhost:8080` by default. Use `SOC_API_UPSTREAM` to point nginx at your backend gateway:

```bash
SOC_API_UPSTREAM=http://soc-api.internal:8081 VITE_USE_MOCKS=false docker compose up --build
```

## Production Recommendations

- Put Keycloak, Authentik, Azure AD, or another OIDC provider in front of the app.
- Use a backend gateway for tenant scoping, RBAC enforcement, audit logging, rate limits, and secret storage.
- Store OpenSearch queries and report jobs server-side.
- Use a message bus such as Redis Streams, NATS, or Kafka for live alert fan-out.
- Keep Ollama behind the gateway and add prompt templates, tool policies, and PII redaction.
- Use mTLS or private networking between gateway, Wazuh, OpenSearch, and Ollama.

More detail is in `docs/API_ARCHITECTURE.md` and `docs/DEPLOYMENT.md`.
=======
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
>>>>>>> 8518e770f813bd10c566e495318fbc2f2e1c07cb
