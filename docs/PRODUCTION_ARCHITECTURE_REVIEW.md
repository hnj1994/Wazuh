# Helios AI SOC - Production Architecture Review & Validation

**Status**: Comprehensive Review Completed  
**Date**: 2026-05-21  
**Reviewer**: GitHub Copilot  
**Environment**: Azure VM (Ubuntu), Public IP: 4.188.228.167

---

## EXECUTIVE SUMMARY

Your AI-powered SOC platform (**Helios AI SOC**) demonstrates solid foundational architecture with:
- ✅ Clean React/TypeScript frontend with Vite build system
- ✅ Modular component design and proper separation of concerns
- ✅ Mock mode for development + production-ready proxy architecture
- ✅ Docker containerization with Nginx reverse proxy
- ✅ Environment-based configuration management

**Critical Issues to Address Before Production**:
1. **Git merge conflict** in README.md (HEAD vs. merge branch)
2. **Missing backend API gateway** (currently frontend-only)
3. **No authentication/authorization backend** (demo hardcoded credentials)
4. **Incomplete Wazuh/OpenSearch/Ollama integration** 
5. **No TLS/HTTPS in production** (only HTTP)
6. **No real-time WebSocket implementation**
7. **Missing audit logging, rate limiting, and secret management**

---

## 1. ARCHITECTURE VALIDATION & ASSESSMENT

### 1.1 Current Architecture (Frontend-Only)

```
┌─────────────────────────────────────────────────────────┐
│                   Browser / React App                    │
│  (Helios AI SOC - React 19 + TypeScript + Vite)        │
│                                                          │
│  • Dashboard, Alerts, Hunt, MITRE, Incidents, SOAR    │
│  • AI Copilot Chat (Ollama integration placeholder)    │
│  • Mock data generators for development                │
│  • Zustand state management                             │
└────────────────┬──────────────────────────────────────┘
                 │ HTTP/HTTPS (Vite proxy in dev)
                 │ OR Nginx proxy in Docker
                 │
    ┌────────────┼────────────┬──────────────────┐
    │            │            │                  │
    ▼            ▼            ▼                  ▼
 Wazuh API  OpenSearch   Ollama API          (Backend Gap)
 (Exposed)   (Exposed)    (Exposed)
```

**Issues**:
- ❌ Frontend directly calls Wazuh/OpenSearch/Ollama APIs (credential exposure risk)
- ❌ No backend gateway for RBAC, tenant scoping, audit logging
- ❌ No API key/credential management
- ❌ CORS vulnerabilities if exposed to internet
- ❌ WebSocket proxy incomplete

### 1.2 Recommended Production Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Internet Users                           │
│                    (4.188.228.167 + domain)                    │
└────────────────┬───────────────────────────────────────────────┘
                 │ HTTPS/TLS 1.3 + HSTS + CSP
                 │
┌────────────────▼───────────────────────────────────────────────┐
│                   Nginx Reverse Proxy                           │
│  • SSL/TLS termination                                         │
│  • Rate limiting (Nginx limit_req)                            │
│  • Request validation & routing                               │
│  • GZIP compression                                            │
│  • Static asset caching (30 days)                             │
│  • WebSocket upgrade support                                   │
└────────────────┬───────────────────────────────────────────────┘
                 │ HTTP (internal, Azure VNET)
                 │
┌────────────────▼───────────────────────────────────────────────┐
│              Backend-for-Frontend (BFF) API Gateway             │
│                    Node.js / Python / Go                        │
│                                                                  │
│  Core Responsibilities:                                         │
│  • OIDC/SAML authentication (Keycloak/Authentik)              │
│  • JWT token validation & refresh                             │
│  • RBAC enforcement (admin/analyst/viewer roles)              │
│  • Tenant isolation (multi-tenant data scoping)               │
│  • Request validation & sanitization                          │
│  • Audit logging (who/what/when/where/why)                   │
│  • Rate limiting per user/tenant                              │
│  • Secret redaction (credentials, API keys)                   │
│  • Request/response transformation                            │
│  • Error handling & graceful degradation                      │
│  • API versioning                                              │
└────────┬───────────┬──────────────┬───────────────┬───────────┘
         │           │              │               │
         ▼           ▼              ▼               ▼
    Wazuh API   OpenSearch    Ollama API      Alert Queue
    (mTLS)      (mTLS)       (mTLS + Auth)    (Redis/Kafka)
    55000       9200         11434           6379/9092
    (internal)  (internal)   (internal)      (internal)
```

### 1.3 Performance Assessment

**Current State**:
- ✅ React 19 with modern JSX (good for performance)
- ✅ Vite for fast dev/build (3x faster than webpack)
- ✅ Tree-shaking & code splitting capable
- ✅ Gzip compression in Nginx
- ✅ Static asset caching (30 days)
- ✅ Zustand state management (minimal overhead)

**Gaps**:
- ❌ No code splitting (all chunks bundled together)
- ❌ No lazy loading of pages/routes
- ❌ No virtual scrolling for large alert tables
- ❌ No pagination/infinite scroll for search results
- ❌ No query result caching
- ❌ No response compression beyond gzip
- ❌ No performance monitoring (Sentry/NewRelic)
- ❌ No CDN for static assets

---

## 2. CODE STRUCTURE REVIEW

### 2.1 Folder Organization

✅ **Strengths**:
```
src/
├── components/      # Reusable UI components (layout, dashboard, chat)
├── data/           # Mock data generators for development
├── hooks/          # Custom React hooks (theme, WebSocket)
├── lib/            # Utilities (RBAC, query translation, formatting)
├── pages/          # Page components (Dashboard, Alerts, Hunt, MITRE, etc.)
├── services/       # API adapters (Wazuh, OpenSearch, Ollama, mock)
│   ├── api/
│   ├── correlation/
│   └── websocket/
├── store/          # Zustand stores (auth, SOC data, UI)
├── types/          # TypeScript domain models
└── vite-env.d.ts   # Vite environment variable types
```

**Well-structured**, follows domain-driven design patterns.

### 2.2 Build System & Dependencies

✅ **Strengths**:
- TypeScript strict mode enabled
- ESLint configured for code quality
- React Router v7 for SPA routing
- Zustand for lightweight state management
- Tailwind CSS for styling
- Lucide React icons (light, tree-shakeable)
- Recharts for dashboards

❌ **Gaps**:
- No testing framework (Jest, Vitest)
- No E2E testing (Cypress, Playwright)
- No Storybook for component documentation
- No accessibility testing (axe)
- No performance testing (Lighthouse CI)

### 2.3 TypeScript Configuration

```json
✅ "strict": true              // Strict mode enabled
✅ "noEmit": true              // Don't emit JS from tsc
✅ "isolatedModules": true     // Safe for esbuild
✅ "jsx": "react-jsx"          // Modern JSX transform
✅ "baseUrl" + "paths"         // Path aliases (@/*)
❌ "skipLibCheck": true        // ⚠️ Skips type checking on deps
```

**Recommendation**: 
- Keep `skipLibCheck: true` for build speed
- Add `noUnusedLocals: true`
- Add `noUnusedParameters: true`
- Add `exactOptionalPropertyTypes: true`

---

## 3. SECURITY REVIEW

### 3.1 Critical Security Issues

#### **Issue #1: Credential Exposure in Frontend**
```typescript
// ❌ CURRENT (DANGEROUS)
const VITE_WAZUH_BASE_URL = "https://wazuh.example.local:55000"
const VITE_OPENSEARCH_BASE_URL = "https://opensearch.example.local:9200"
// Browser can see these URLs + make direct API calls
```

**Risk**: 
- Attackers can discover internal IP addresses
- Direct API access from browser (CORS bypass)
- Credentials stored in browser localStorage
- No encryption in transit (HTTP/unencrypted)

**Solution**:
```typescript
// ✅ CORRECT
// Frontend only knows about backend gateway
const API_BASE = "/api"  // Same-origin requests only

// Backend handles:
// - Authentication with Wazuh/OpenSearch/Ollama
// - Credential injection from secure vaults
// - Request signing & mTLS
```

#### **Issue #2: Hard-coded Demo Credentials**
```typescript
// ❌ CURRENT
const DEMO_USERS = [
  { email: "admin@soc.local", password: "admin123" },
  { email: "analyst@soc.local", password: "analyst123" },
  { email: "viewer@soc.local", password: "viewer123" }
]
// Visible in frontend code
```

**Solution**:
- Remove demo credentials from production builds
- Use OIDC (Keycloak, Azure AD, Okta) for real auth
- Store auth tokens in httpOnly cookies (not localStorage)

#### **Issue #3: No HTTPS/TLS**
```nginx
# ❌ CURRENT nginx.conf
listen 80;  # HTTP only
```

**Solution**:
```nginx
# ✅ CORRECT
listen 443 ssl http2;
ssl_certificate /etc/nginx/certs/soc.crt;
ssl_certificate_key /etc/nginx/certs/soc.key;
ssl_protocols TLSv1.3 TLSv1.2;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;

# HSTS header
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Redirect HTTP to HTTPS
server {
  listen 80;
  return 301 https://$host$request_uri;
}
```

#### **Issue #4: Missing Security Headers**
```nginx
# ✅ ADD TO nginx.conf
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Content Security Policy (strict)
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' /api /ws;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
" always;
```

#### **Issue #5: No Rate Limiting**
```nginx
# ❌ CURRENT
# No protection against brute force/DDoS

# ✅ ADD TO nginx.conf
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

server {
  location /api/auth/login { limit_req zone=login burst=10 nodelay; }
  location /api/                { limit_req zone=api burst=50 nodelay; }
  location /                    { limit_req zone=general burst=100 nodelay; }
}
```

#### **Issue #6: No Authentication/Authorization**
```typescript
// ❌ CURRENT
// Anyone can access /alerts, /hunt, /admin pages in browser

// ✅ CORRECT
// Require JWT token in Authorization header
// Validate on backend before proxying to APIs
// Enforce RBAC on resources
```

#### **Issue #7: WebSocket No Security**
```typescript
// ❌ CURRENT
// wss://soc-api.example.local/ws/alerts
// WebSocket connection has no auth, rate limiting, or encryption

// ✅ CORRECT
// Require JWT token in WebSocket handshake
// Validate tenant scoping before streaming alerts
// Implement per-connection rate limiting
```

### 3.2 Security Checklist

| Item | Status | Priority | Action |
|------|--------|----------|--------|
| HTTPS/TLS 1.3 | ❌ | CRITICAL | Add SSL cert + redirect HTTP→HTTPS |
| Authentication (OIDC) | ❌ | CRITICAL | Deploy Keycloak/Authentik, validate JWT |
| RBAC enforcement | ❌ | CRITICAL | Backend checks roles before proxying |
| Tenant isolation | ❌ | CRITICAL | Backend scopes queries by tenant |
| Credential management | ❌ | CRITICAL | Vault (HashiCorp, AWS Secrets Manager) |
| Audit logging | ❌ | HIGH | Log all API calls (user, action, result) |
| Rate limiting | ❌ | HIGH | Nginx + backend per-user/tenant limits |
| Secret redaction | ❌ | HIGH | Strip API keys/passwords from logs/UI |
| CORS headers | ❌ | MEDIUM | Nginx proxy handles - only same-origin |
| Security headers | ❌ | MEDIUM | CSP, X-Frame-Options, HSTS, etc. |
| Dependency scanning | ❌ | MEDIUM | Dependabot + npm audit |
| Container scanning | ❌ | MEDIUM | Trivy, Snyk for Docker images |
| Network segmentation | ❌ | MEDIUM | Private subnets + NSG rules |
| mTLS between services | ❌ | MEDIUM | Cert-based auth for internal APIs |

---

## 4. EXTERNAL EXPOSURE & NETWORKING

### 4.1 Current Deployment Issues

**Problem**: Frontend runs on `http://localhost:8080` or Docker container.  
**Issue**: Exposes internal API routes to internet without protection.

### 4.2 Azure NSG (Network Security Group) Configuration

```yaml
# ✅ RECOMMENDED NSG Rules for 4.188.228.167

SecurityGroup: "soc-nsg"
Inbound:
  - Priority: 100
    Source: "Any" (0.0.0.0/0)
    Port: 443
    Protocol: TCP
    Action: Allow
    Name: "HTTPS-In"

  - Priority: 110
    Source: "Any" (0.0.0.0/0)
    Port: 80
    Protocol: TCP
    Action: Allow
    Name: "HTTP-Redirect"

  - Priority: 120
    Source: "MyIP/YourOfficeIP" (Whitelist)
    Port: 22
    Protocol: TCP
    Action: Allow
    Name: "SSH-Admin"

  - Priority: 1000
    Source: "Any"
    Port: "*"
    Protocol: "*"
    Action: Deny
    Name: "DenyAllInbound"

Outbound:
  - Priority: 100
    Destination: "VirtualNetwork"
    Port: "*"
    Protocol: "*"
    Action: Allow
    Name: "AllowVNet"

  - Priority: 110
    Destination: "0.0.0.0/0"
    Port: 443
    Protocol: TCP
    Action: Allow
    Name: "OutboundHTTPS"

  - Priority: 1000
    Destination: "0.0.0.0/0"
    Port: "*"
    Protocol: "*"
    Action: Deny
    Name: "DenyAllOutbound"
```

### 4.3 Firewall Rules Summary

| Rule | Source | Dest Port | Action | Note |
|------|--------|-----------|--------|------|
| HTTPS-In | 0.0.0.0/0 | 443 | Allow | Public internet access |
| HTTP-In | 0.0.0.0/0 | 80 | Allow | Redirect to HTTPS |
| SSH-In | Admin-IP | 22 | Allow | Locked down to admins |
| Wazuh-Internal | VNet | 55000 | Allow | Internal only |
| OpenSearch-Internal | VNet | 9200 | Allow | Internal only |
| Ollama-Internal | VNet | 11434 | Allow | Internal only |
| Backend-API-Internal | VNet | 8081 | Allow | Internal only |
| Redis-Internal | VNet | 6379 | Allow | Internal only |
| Default-Deny | Any | * | Deny | Whitelist approach |

### 4.4 Deployment Architecture on Azure

```
┌─────────────────────────────────────────────────────────────┐
│                      Azure Virtual Network                   │
│                   (VNet: 10.0.0.0/16)                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Public Subnet (10.0.1.0/24)             │   │
│  │                                                       │   │
│  │   ┌──────────────────────────────────────────────┐   │   │
│  │   │  Ubuntu VM (4.188.228.167)                  │   │   │
│  │   │  - Nginx Reverse Proxy (443/80)              │   │   │
│  │   │  - React Static App (dist/)                  │   │   │
│  │   │  - Docker: helios-soc container              │   │   │
│  │   └──────────────────────────────────────────────┘   │   │
│  │              ↓                                         │   │
│  │   ┌──────────────────────────────────────────────┐   │   │
│  │   │  Application Gateway (Optional)              │   │   │
│  │   │  - WAF rules                                  │   │   │
│  │   │  - DDoS protection                            │   │   │
│  │   │  - Certificate management                     │   │   │
│  │   └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             Private Subnet (10.0.2.0/24)             │   │
│  │                                                       │   │
│  │  ┌──────────────────┬──────────────┬──────────────┐  │   │
│  │  │                  │              │              │  │   │
│  │  ▼                  ▼              ▼              ▼  │   │
│  │ Wazuh Manager   OpenSearch     Ollama           BFF │   │
│  │ (55000)         (9200)         (11434)          API │   │
│  │                                                (8081)│   │
│  │  [Redis Streams / Alert Queue]                     │   │
│  │  (6379)                                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
        ↓                              ↑
    Internet Users              Monitoring/Logging
```

---

## 5. SSL/HTTPS SETUP

### 5.1 Obtain SSL Certificate

#### **Option A: Let's Encrypt (Recommended for Azure)**
```bash
# Using Certbot on Ubuntu
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate for your domain
sudo certbot certonly \
  --standalone \
  -d soc.yourdomain.com \
  -d soc.4.188.228.167.nip.io

# Or use Azure-native approach
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d soc.yourdomain.com
```

#### **Option B: Azure Key Vault (Enterprise)**
```bash
# Upload self-signed cert to Azure Key Vault
az keyvault create --name "soc-keyvault" --resource-group "rg-soc"

az keyvault certificate import \
  --vault-name "soc-keyvault" \
  --name "soc-cert" \
  --file "./soc.pfx"

# Reference in Application Gateway or VM
```

#### **Option C: Self-Signed (Development Only)**
```bash
# ⚠️ NOT for production
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout /etc/nginx/certs/soc.key \
  -out /etc/nginx/certs/soc.crt \
  -subj "/C=US/ST=CA/L=SF/O=Org/CN=soc.example.com"
```

### 5.2 Updated Nginx Configuration with SSL

```nginx
# /etc/nginx/templates/default.conf.template

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name _;
  return 301 https://$host$request_uri;
}

# HTTPS server
server {
  listen 443 ssl http2;
  server_name _;

  # SSL configuration
  ssl_certificate /etc/nginx/certs/soc.crt;
  ssl_certificate_key /etc/nginx/certs/soc.key;
  ssl_protocols TLSv1.3 TLSv1.2;
  ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;

  # CSP header
  add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'wasm-unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' /api /ws;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  " always;

  # Root & index
  root /usr/share/nginx/html;
  index index.html;

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json image/svg+xml;
  gzip_min_length 1000;
  gzip_disable "msie6";

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
  limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
    limit_req zone=general burst=100 nodelay;
  }

  # API proxy
  location /api/ {
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_pass ${SOC_API_UPSTREAM}/api/;
    limit_req zone=api burst=50 nodelay;
    
    # Timeout for long-running queries
    proxy_read_timeout 120s;
    proxy_connect_timeout 30s;
  }

  # WebSocket proxy
  location /ws/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass ${SOC_API_UPSTREAM}/ws/;
    
    # WebSocket timeouts
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
  }

  # Static assets
  location ~* \.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
  }

  # Deny access to sensitive files
  location ~ /\. {
    deny all;
  }

  location ~ ~$ {
    deny all;
  }
}
```

### 5.3 Docker Compose with SSL

```yaml
services:
  helios-soc:
    build:
      context: .
      args:
        VITE_APP_NAME: "Helios AI SOC"
        VITE_USE_MOCKS: "false"
        VITE_WAZUH_PROXY_PATH: "/api/wazuh"
        VITE_OPENSEARCH_PROXY_PATH: "/api/opensearch"
        VITE_OLLAMA_PROXY_PATH: "/api/ollama"
        VITE_WAZUH_WS_URL: "wss://soc.yourdomain.com/ws/alerts"
        VITE_OLLAMA_MODEL: "llama3.1:8b"
        VITE_DEFAULT_TENANT: "apex"
    
    ports:
      - "80:80"
      - "443:443"
    
    environment:
      SOC_API_UPSTREAM: "http://soc-api:8081"  # Internal only
    
    volumes:
      # SSL certificates
      - /etc/letsencrypt/live/soc.yourdomain.com/fullchain.pem:/etc/nginx/certs/soc.crt:ro
      - /etc/letsencrypt/live/soc.yourdomain.com/privkey.pem:/etc/nginx/certs/soc.key:ro
    
    restart: unless-stopped
    
    networks:
      - soc-network

  soc-api:
    image: soc-api:latest  # Your backend gateway
    environment:
      PORT: 8081
      WAZUH_API_URL: "http://wazuh-manager:55000"
      WAZUH_API_KEY: ${WAZUH_API_KEY}
      OPENSEARCH_URL: "http://opensearch:9200"
      OPENSEARCH_USER: ${OPENSEARCH_USER}
      OPENSEARCH_PASS: ${OPENSEARCH_PASS}
      OLLAMA_URL: "http://ollama:11434"
      REDIS_URL: "redis://redis:6379"
      JWT_SECRET: ${JWT_SECRET}
    
    restart: unless-stopped
    networks:
      - soc-network

networks:
  soc-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

---

## 6. API INTEGRATION ARCHITECTURE

### 6.1 Missing Backend Gateway

**Current Problem**: Frontend directly calls Wazuh/OpenSearch/Ollama.

**Required Backend (BFF/API Gateway)** - Node.js Express Example:

```typescript
// soc-api/src/server.ts

import express from 'express';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Redis from 'ioredis';

const app = express();
const redis = new Redis(process.env.REDIS_URL);

// ============ MIDDLEWARE ============

// JWT validation middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;  // { sub, email, roles, tenant }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Tenant isolation middleware
const tenantMiddleware = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  // Extract tenant from token or user context
  req.tenant = req.user.tenant || process.env.DEFAULT_TENANT;
  next();
};

// RBAC middleware
const rbacMiddleware = (allowedRoles: string[]) => {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    if (!allowedRoles.some(role => userRoles.includes(role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// Audit logging middleware
const auditMiddleware = (req, res, next) => {
  res.on('finish', () => {
    console.log({
      timestamp: new Date().toISOString(),
      user: req.user?.email,
      tenant: req.tenant,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    // TODO: Send to Elasticsearch/Splunk for audit logs
  });
  next();
};

app.use(express.json());
app.use(auditMiddleware);
app.use(authMiddleware);
app.use(tenantMiddleware);

// ============ WAZUH API ROUTES ============

const wazuhAPI = axios.create({
  baseURL: process.env.WAZUH_API_URL,
  https: {
    rejectUnauthorized: false  // Use mTLS in production
  }
});

app.get('/api/wazuh/agents', rbacMiddleware(['admin', 'analyst']), async (req, res) => {
  try {
    // Authenticate with Wazuh using service account
    const authRes = await wazuhAPI.post('/security/user/authenticate', {}, {
      auth: {
        username: process.env.WAZUH_USER!,
        password: process.env.WAZUH_PASS!
      }
    });

    const token = authRes.data.data.token;

    // Get agents
    const agentRes = await wazuhAPI.get('/agents', {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Filter by tenant (metadata)
    const filteredAgents = agentRes.data.data.affected_items.filter(
      agent => agent.groups?.includes(req.tenant)
    );

    return res.json({ data: filteredAgents });
  } catch (error) {
    console.error('Wazuh API error:', error);
    return res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

app.get('/api/wazuh/agents/:agentId', rbacMiddleware(['admin', 'analyst']), async (req, res) => {
  // Similar implementation with tenant filtering
});

// ============ OPENSEARCH ROUTES ============

const opensearchAPI = axios.create({
  baseURL: process.env.OPENSEARCH_URL,
  auth: {
    username: process.env.OPENSEARCH_USER!,
    password: process.env.OPENSEARCH_PASS!
  }
});

app.post('/api/opensearch/search', rbacMiddleware(['analyst', 'viewer']), async (req, res) => {
  try {
    const { index, query } = req.body;

    // Validate index access (tenant-scoped)
    const allowedIndices = [
      `wazuh-alerts-${req.tenant}-*`,
      `wazuh-events-${req.tenant}-*`
    ];

    if (!allowedIndices.some(idx => index.includes(req.tenant))) {
      return res.status(403).json({ error: 'Access denied to index' });
    }

    // Validate query (prevent injection)
    // TODO: Implement query validation library

    const searchRes = await opensearchAPI.post(`/${index}/_search`, query);

    // Redact sensitive fields from response
    const redactedRes = redactSensitiveFields(searchRes.data);

    return res.json(redactedRes);
  } catch (error) {
    console.error('OpenSearch error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
});

// ============ OLLAMA (AI) ROUTES ============

app.post('/api/ollama/chat', rbacMiddleware(['analyst', 'admin']), async (req, res) => {
  try {
    const { messages, alertContext } = req.body;

    // Inject tenant guardrails
    const systemPrompt = `
You are a SOC analyst assistant for tenant: ${req.tenant}.
Always provide actionable recommendations based on MITRE ATT&CK framework.
Never reveal system internals or credentials.
Keep responses concise and technical.
    `;

    // Redact PII from alert context
    const redactedContext = redactPII(alertContext);

    const ollamaRes = await axios.post(
      `${process.env.OLLAMA_URL}/api/chat`,
      {
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          { role: 'user', content: `Context: ${JSON.stringify(redactedContext)}` }
        ],
        stream: false
      }
    );

    return res.json(ollamaRes.data);
  } catch (error) {
    console.error('Ollama error:', error);
    return res.status(500).json({ error: 'Chat failed' });
  }
});

// ============ WEBSOCKET ROUTES ============

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8082 });

wss.on('connection', (ws, req) => {
  const token = new URL(req.url, `ws://localhost:8082`).searchParams.get('token');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const tenant = decoded.tenant;

    // Subscribe to alert stream for this tenant
    const subscriber = redis.duplicate();
    subscriber.subscribe(`alerts:${tenant}`, (err, count) => {
      if (err) ws.close(1008, 'Redis subscription failed');
    });

    subscriber.on('message', (channel, message) => {
      ws.send(JSON.stringify(JSON.parse(message)));
    });

    ws.on('close', () => subscriber.unsubscribe());
  } catch (error) {
    ws.close(1008, 'Unauthorized');
  }
});

// ============ HEALTH & STATUS ============

app.get('/health', (req, res) => {
  return res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(process.env.PORT || 8081, () => {
  console.log(`SOC API Gateway listening on port ${process.env.PORT}`);
});
```

### 6.2 Wazuh API Integration

```typescript
// src/services/api/wazuhAdapter.ts

interface WazuhAgent {
  id: string;
  name: string;
  status: 'active' | 'disconnected' | 'pending' | 'never_connected';
  groups: string[];
  ipv4: string;
  version: string;
}

export class WazuhAPIAdapter {
  private baseUrl: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseUrl = import.meta.env.VITE_WAZUH_PROXY_PATH;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      // No credentials here - handled by backend
    });
  }

  async getAgents(): Promise<WazuhAgent[]> {
    const response = await this.axiosInstance.get('/agents');
    return response.data.data;
  }

  async getAgentVulnerabilities(agentId: string): Promise<Vulnerability[]> {
    const response = await this.axiosInstance.get(`/agents/${agentId}/vulnerabilities`);
    return response.data.data;
  }

  async executeCommand(agentId: string, command: string): Promise<void> {
    // Real-time command execution
    await this.axiosInstance.post(`/agents/${agentId}/command`, { command });
  }
}
```

### 6.3 OpenSearch Integration

```typescript
// src/services/api/opensearchAdapter.ts

interface SearchQuery {
  index: string;
  query: Record<string, unknown>;
  from?: number;
  size?: number;
}

interface Alert {
  id: string;
  timestamp: string;
  rule_id: string;
  rule_description: string;
  source_ip: string;
  destination_ip: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  mitre_tactics: string[];
}

export class OpenSearchAdapter {
  private baseUrl: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseUrl = import.meta.env.VITE_OPENSEARCH_PROXY_PATH;
    this.axiosInstance = axios.create({ baseURL: this.baseUrl });
  }

  async searchAlerts(query: SearchQuery): Promise<Alert[]> {
    const response = await this.axiosInstance.post(
      `/${query.index}/_search`,
      {
        query: query.query,
        from: query.from || 0,
        size: query.size || 20
      }
    );

    return response.data.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source
    }));
  }

  async getAlertByIndex(index: string, id: string): Promise<Alert> {
    const response = await this.axiosInstance.get(`/${index}/_doc/${id}`);
    return response.data._source;
  }

  // Query translation from frontend filter → OpenSearch DSL
  translateQuery(filters: FilterExpression): Record<string, unknown> {
    // Convert Lucene/frontend filters to OpenSearch DSL
    return {
      bool: {
        must: filters.map(f => ({
          match: { [f.field]: f.value }
        }))
      }
    };
  }
}
```

### 6.4 Ollama Integration

```typescript
// src/services/api/ollamaAdapter.ts

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  response: string;
  mitre_tactics?: string[];
  recommendations?: string[];
}

export class OllamaAdapter {
  private baseUrl: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseUrl = import.meta.env.VITE_OLLAMA_PROXY_PATH;
    this.axiosInstance = axios.create({ baseURL: this.baseUrl });
  }

  async chat(
    messages: ChatMessage[],
    alertContext?: Record<string, unknown>
  ): Promise<ChatResponse> {
    const response = await this.axiosInstance.post('/api/chat', {
      model: import.meta.env.VITE_OLLAMA_MODEL || 'llama3.1:8b',
      messages,
      stream: false
    });

    return {
      response: response.data.response,
      mitre_tactics: this.extractMITRETactics(response.data.response),
      recommendations: this.extractRecommendations(response.data.response)
    };
  }

  private extractMITRETactics(text: string): string[] {
    // Parse MITRE tactics from Ollama response
    const tactics = text.match(/\[MITRE: ([\w\s,]+)\]/gi) || [];
    return tactics.map(t => t.replace(/\[MITRE: |\]/g, ''));
  }

  private extractRecommendations(text: string): string[] {
    // Extract action items from response
    const recommendations = text.match(/- (.+)/g) || [];
    return recommendations.map(r => r.replace('- ', ''));
  }
}
```

### 6.5 Real-Time Alert Streaming

```typescript
// src/services/websocket/alertStream.ts

export class AlertStreamClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(
    private token: string,
    private onAlert: (alert: Alert) => void,
    private onError: (error: string) => void
  ) {}

  connect(): void {
    const wsUrl = new URL(
      import.meta.env.VITE_WAZUH_WS_URL || 'wss://localhost/ws/alerts',
      window.location.origin
    );

    // Pass JWT token in query param or header
    wsUrl.searchParams.set('token', this.token);

    this.ws = new WebSocket(wsUrl.toString());

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const alert = JSON.parse(event.data) as Alert;
        this.onAlert(alert);
      } catch (error) {
        this.onError('Failed to parse alert message');
      }
    };

    this.ws.onerror = () => {
      this.onError('WebSocket error');
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### 6.6 Environment Configuration for Backend

```bash
# .env (Backend Gateway)

# Server
PORT=8081
NODE_ENV=production

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_EXPIRY=24h

# Wazuh Integration
WAZUH_API_URL=http://wazuh-manager:55000
WAZUH_USER=wazuh-admin
WAZUH_PASS=secure-wazuh-password
WAZUH_API_KEY=wazuh-api-key-if-using-key-auth

# OpenSearch Integration
OPENSEARCH_URL=http://opensearch:9200
OPENSEARCH_USER=admin
OPENSEARCH_PASS=secure-opensearch-password
OPENSEARCH_SSL_VERIFY=true
OPENSEARCH_CERT_PATH=/etc/ssl/certs/opensearch-ca.pem

# Ollama Integration
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_TIMEOUT=120s

# Redis (Alert streaming, caching)
REDIS_URL=redis://redis:6379

# Database (Audit logs, sessions)
DATABASE_URL=postgresql://user:pass@postgres:5432/soc

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Multi-tenancy
DEFAULT_TENANT=apex
ALLOWED_TENANTS=apex,client-a,client-b

# Security
CORS_ORIGIN=https://soc.yourdomain.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
API_KEY_ROTATION_DAYS=90

# OIDC (Optional)
OIDC_PROVIDER_URL=https://keycloak:8443
OIDC_CLIENT_ID=soc-platform
OIDC_CLIENT_SECRET=secret
```

---

## 7. PRODUCTION DEPLOYMENT CHECKLIST

### 7.1 Pre-Deployment Validation

```bash
# Code quality
npm run lint        # ESLint
npm run typecheck   # TypeScript strict checks

# Build optimization
npm run build       # Vite production build
npm run build -- --analyze  # Bundle analysis

# Security
npm audit          # Check for vulnerable dependencies
npm audit fix      # Auto-fix if possible

# Container
docker build -t helios-soc:latest .
docker scan helios-soc:latest  # Trivy/Snyk scan

# Network connectivity
curl -k https://4.188.228.167/health
curl -k https://soc.yourdomain.com/health
```

### 7.2 Infrastructure Setup

```bash
# 1. Azure VM Setup
az vm create \
  --resource-group rg-soc \
  --name soc-vm \
  --image UbuntuLTS \
  --size Standard_D4s_v3 \
  --admin-username azureuser \
  --generate-ssh-keys

# 2. Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# 3. Configure firewall
az network nsg rule create \
  --resource-group rg-soc \
  --nsg-name soc-nsg \
  --name AllowHTTPS \
  --priority 100 \
  --source-address-prefixes '*' \
  --source-port-ranges '*' \
  --destination-address-prefixes '*' \
  --destination-port-ranges 443 \
  --protocol Tcp \
  --access Allow

# 4. Setup SSL certificates
sudo certbot certonly \
  --standalone \
  -d soc.yourdomain.com

# 5. Deploy containers
sudo docker-compose up -d

# 6. Verify deployment
curl https://soc.yourdomain.com
```

### 7.3 Monitoring & Observability

```yaml
# docker-compose.yml additions

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

volumes:
  prometheus-data:
  grafana-data:
```

---

## 8. MISSING FEATURES & RECOMMENDED ADDITIONS

### 8.1 High-Priority Features

| Feature | Priority | Effort | Impact | Notes |
|---------|----------|--------|--------|-------|
| **Backend API Gateway** | CRITICAL | 2-3 weeks | CRITICAL | Required for production |
| **OIDC Authentication** | CRITICAL | 1 week | HIGH | Keycloak/Authentik integration |
| **RBAC Enforcement** | CRITICAL | 1 week | HIGH | Per-resource permission checks |
| **Tenant Isolation** | CRITICAL | 2 weeks | HIGH | Query scoping, data segregation |
| **Audit Logging** | HIGH | 1 week | HIGH | Compliance, forensics |
| **Rate Limiting** | HIGH | 3 days | MEDIUM | Prevent abuse/DDoS |
| **Alert Correlation Engine** | HIGH | 2-3 weeks | HIGH | ML-based anomaly detection |
| **Incident Response Workflows** | HIGH | 2-3 weeks | HIGH | SOAR automation |
| **Real-time WebSocket** | HIGH | 1 week | HIGH | Live alert streaming |
| **MITRE ATT&CK Mapping** | MEDIUM | 2 weeks | MEDIUM | Coverage heatmap, navigator |
| **Threat Hunting Queries** | MEDIUM | 2 weeks | MEDIUM | Pre-built queries library |
| **Executive Reports** | MEDIUM | 2 weeks | MEDIUM | PDF export, scheduling |
| **API Documentation** | MEDIUM | 3 days | MEDIUM | OpenAPI/Swagger |
| **Helm Charts** | MEDIUM | 1 week | MEDIUM | Kubernetes deployment |
| **Performance Monitoring** | MEDIUM | 1 week | MEDIUM | APM (New Relic, DataDog) |

### 8.2 Medium-Priority Enhancements

- **Slack/Teams Integration**: Auto-notify on critical alerts
- **Third-party SIEM Connectors**: Splunk, Elastic, ArcSight
- **Playbook Library**: Pre-configured response workflows
- **Case Management**: Ticket tracking, SLA monitoring
- **Email Reporting**: Scheduled digest emails
- **Mobile App**: React Native companion app
- **Dark Mode**: UI theme switching
- **Multi-language Support**: i18n for global SOCs
- **Custom Dashboard Builder**: Drag-and-drop widgets
- **Data Retention Policies**: GDPR/HIPAA compliance

### 8.3 Recommended Tech Stack Improvements

```typescript
// Current
✅ React 19 + TypeScript + Vite
✅ Tailwind CSS + Lucide icons
✅ Zustand state management
✅ React Router v7
✅ Recharts dashboard library

// Recommended Additions
backend-api/
├── Node.js Express (or Fastify/Nest.js)
├── PostgreSQL (audit logs, users, settings)
├── Redis (caching, alert streaming)
├── JWT + OAuth2/OIDC (authentication)
├── class-validator (request validation)
├── winston (logging)
├── helmet (security headers)
├── @sentry/node (error tracking)
└── @aws-sdk or @azure/storage (cloud integration)

frontend/
├── @tanstack/react-query (server state)
├── @tanstack/react-table (complex tables)
├── react-hook-form (form validation)
├── zod (schema validation)
├── recharts (charts) - already have
├── @radix-ui (accessible components)
├── next/image (image optimization)
└── vitest + @testing-library/react (testing)
```

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)
- [ ] Resolve README.md merge conflict
- [ ] Deploy Nginx with SSL/HTTPS
- [ ] Setup Azure NSG rules
- [ ] Create backend API gateway skeleton
- [ ] Implement JWT token validation

### Phase 2: Security (Weeks 3-4)
- [ ] Integrate OIDC provider (Keycloak)
- [ ] Implement RBAC middleware
- [ ] Add rate limiting & request validation
- [ ] Setup audit logging
- [ ] Configure secrets vault

### Phase 3: Integration (Weeks 5-7)
- [ ] Complete Wazuh API integration
- [ ] Complete OpenSearch integration
- [ ] Complete Ollama AI integration
- [ ] Implement real-time WebSocket alerting
- [ ] Add alert correlation engine

### Phase 4: Enterprise Features (Weeks 8-10)
- [ ] Tenant isolation & multi-tenancy
- [ ] MITRE ATT&CK mapping
- [ ] Threat hunting query builder
- [ ] Incident response workflows
- [ ] Executive reporting

### Phase 5: Production Hardening (Weeks 11-12)
- [ ] Performance testing & optimization
- [ ] Security penetration testing
- [ ] Disaster recovery & backup setup
- [ ] Documentation & runbooks
- [ ] Go-live preparation

---

## 10. SECURITY HARDENING GUIDE

### 10.1 Secrets Management

```bash
# Option A: HashiCorp Vault
vault kv put secret/soc/wazuh \
  api_url=https://wazuh.internal:55000 \
  username=wazuh-admin \
  password=<redacted>

# Option B: Azure Key Vault
az keyvault secret set --vault-name soc-keyvault \
  --name wazuh-api-password \
  --value <redacted>

# Option C: Sealed Secrets (Kubernetes)
# See: https://sealed-secrets.dev/
```

### 10.2 Network Hardening

```bash
# Enable UFW firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Configure fail2ban for brute-force protection
sudo apt-get install fail2ban
# Update /etc/fail2ban/jail.local
```

### 10.3 Container Security

```dockerfile
# ✅ SECURE Dockerfile

FROM node:22-alpine AS builder

# Install security updates
RUN apk update && apk add --no-cache curl

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Use distroless for final image (no shell, minimal attack surface)
FROM gcr.io/distroless/nodejs22-debian12

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules

USER nonroot
EXPOSE 3000

CMD ["dist/index.js"]
```

### 10.4 Compliance Checklist

| Standard | Requirement | Status | Evidence |
|----------|-----------|--------|----------|
| NIST CSF | Access Control | ❌ | OIDC + RBAC |
| NIST CSF | Audit Logging | ❌ | Centralized logs |
| NIST CSF | Encryption | ❌ | TLS 1.3 + at-rest |
| PCI DSS | Authentication | ❌ | Multi-factor auth |
| HIPAA | Data Encryption | ❌ | AES-256 |
| GDPR | Data Retention | ❌ | Automatic purge |
| ISO 27001 | Risk Assessment | ❌ | Documented |

---

## 11. FREQUENTLY ASKED QUESTIONS

### Q: Should I expose the frontend directly to the internet?
**A**: No. Always use a reverse proxy (Nginx) with SSL/TLS. Backend APIs should remain private.

### Q: Can I use the demo credentials in production?
**A**: Absolutely not. Implement OIDC/SAML authentication immediately.

### Q: How do I ensure tenant isolation?
**A**: At the backend layer, validate every query/request includes the tenant scope. Filter results accordingly.

### Q: What's the best way to stream real-time alerts?
**A**: WebSocket + Redis Pub/Sub. Backend subscribes to OpenSearch/Wazuh, republishes to authenticated clients.

### Q: How do I handle Ollama credentials securely?
**A**: Ollama should be private, on backend only. Frontend calls `/api/ollama/chat`, backend injects credentials.

### Q: Can I use this for compliance (HIPAA, PCI DSS)?
**A**: Possibly, but you must implement additional controls: encryption at rest, audit logging, MFA, RBAC, data retention policies.

---

## 12. NEXT STEPS

1. **Resolve Git Conflict**
   - Fix README.md merge conflict (lines 1-179)
   - Keep the Helios AI SOC content, remove React template

2. **Setup SSL/TLS**
   - Create Let's Encrypt certificate
   - Update nginx.conf with SSL + security headers
   - Test with `curl -I https://4.188.228.167`

3. **Deploy Backend Gateway**
   - Use provided Node.js Express skeleton
   - Implement authentication & RBAC
   - Test Wazuh/OpenSearch/Ollama connectivity

4. **Implement OIDC**
   - Deploy Keycloak or Authentik
   - Configure OIDC provider
   - Update frontend to use OIDC flow

5. **Add Real-time Alerts**
   - Implement WebSocket endpoint
   - Configure Redis Pub/Sub
   - Test alert delivery

6. **Security Testing**
   - Run OWASP ZAP scan
   - Penetration testing
   - Code security audit

---

## CONCLUSION

Your **Helios AI SOC** platform has solid foundational architecture and is well-structured for a React-based SOC dashboard. However, it requires significant work on the **backend, authentication, and security layers** before production deployment.

**Top 3 Priorities**:
1. ✋ **Stop** exposing APIs to the internet
2. 🔐 **Implement** OIDC authentication & RBAC
3. 🛡️ **Add** HTTPS/TLS + security headers

Once these are in place, the platform will be ready for enterprise SOC operations.

