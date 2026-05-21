export type AlertSeverity = "critical" | "high" | "medium" | "low" | "informational";
export type AlertStatus = "new" | "triage" | "investigating" | "contained" | "resolved" | "closed";
export type IncidentStatus = "new" | "triage" | "investigating" | "contained" | "resolved" | "closed";
export type TenantPlan = "enterprise" | "mssp" | "lab";
export type UserRole = "soc_manager" | "tier_3" | "tier_2" | "tier_1" | "viewer" | "tenant_admin";
export type AgentStatus = "active" | "disconnected" | "never_connected" | "pending";
export type SoarRunStatus = "idle" | "running" | "success" | "failed";

export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  region: string;
  retentionDays: number;
}

export interface SocUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantIds: string[];
  avatarUrl?: string;
}

export interface AuthSession {
  token: string;
  user: SocUser;
  activeTenantId: string;
  expiresAt: string;
}

export interface MitreMapping {
  tactic: string;
  tacticId: string;
  technique: string;
  techniqueId: string;
  subTechnique?: string;
  confidence: number;
}

export interface Alert {
  id: string;
  tenantId: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertStatus;
  riskScore: number;
  rule: {
    id: string;
    level: number;
    description: string;
    groups: string[];
  };
  agent: {
    id: string;
    name: string;
    ip: string;
    os: string;
  };
  source: {
    ip?: string;
    port?: number;
    geo?: string;
    user?: string;
  };
  destination?: {
    ip?: string;
    port?: number;
    host?: string;
  };
  process?: {
    name?: string;
    pid?: number;
    parent?: string;
    commandLine?: string;
    hash?: string;
  };
  decoder: string;
  location: string;
  fullLog: string;
  mitre: MitreMapping[];
  tags: string[];
  aiSummary?: string;
  raw: Record<string, unknown>;
}

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  ip: string;
  os: string;
  version: string;
  status: AgentStatus;
  group: string;
  lastSeen: string;
  cpu: number;
  memory: number;
  alertCount24h: number;
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: number | string;
  delta: number;
  intent: "good" | "warn" | "bad" | "neutral";
}

export interface ChartPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  actor?: string;
  asset?: string;
  evidence?: string[];
}

export interface Incident {
  id: string;
  tenantId: string;
  title: string;
  status: IncidentStatus;
  severity: AlertSeverity;
  riskScore: number;
  owner: string;
  createdAt: string;
  updatedAt: string;
  affectedAssets: string[];
  relatedAlertIds: string[];
  mitre: MitreMapping[];
  summary: string;
  timeline: TimelineEvent[];
  recommendedActions: string[];
}

export interface HuntQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  language: "lucene" | "kuery" | "dsl" | "natural";
  tags: string[];
}

export interface HuntResult {
  id: string;
  timestamp: string;
  host: string;
  user?: string;
  eventType: string;
  severity: AlertSeverity;
  message: string;
  source: string;
  mitre?: string;
}

export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
  relatedAlertId?: string;
  citations?: string[];
}

export interface MitreTechnique {
  tactic: string;
  tacticId: string;
  technique: string;
  techniqueId: string;
  detections: number;
  coverage: number;
  lastSeen: string;
  severity: AlertSeverity;
}

export interface SoarStep {
  id: string;
  label: string;
  type: "enrichment" | "containment" | "notification" | "ticket" | "approval";
  status: SoarRunStatus;
}

export interface SoarPlaybook {
  id: string;
  name: string;
  description: string;
  trigger: string;
  enabled: boolean;
  lastRun?: string;
  runs24h: number;
  steps: SoarStep[];
}

export interface ThreatIntelIndicator {
  value: string;
  type: "ip" | "domain" | "hash" | "url" | "email";
  reputation: "malicious" | "suspicious" | "clean" | "unknown";
  confidence: number;
  sources: string[];
  firstSeen: string;
  lastSeen: string;
  tags: string[];
}

export interface SocReport {
  id: string;
  tenantId: string;
  title: string;
  generatedAt: string;
  period: string;
  executiveSummary: string;
  keyFindings: string[];
  metrics: DashboardMetric[];
  incidents: Incident[];
  markdown: string;
}

export interface DashboardData {
  metrics: DashboardMetric[];
  severity: ChartPoint[];
  alertTrend: ChartPoint[];
  topHosts: ChartPoint[];
  failedLogins: ChartPoint[];
  malwareDetections: ChartPoint[];
  networkActivity: ChartPoint[];
  agents: Agent[];
  alerts: Alert[];
  incidents: Incident[];
  mitre: MitreTechnique[];
  playbooks: SoarPlaybook[];
}

export interface SearchFilters {
  tenantId: string;
  query?: string;
  severities?: AlertSeverity[];
  status?: AlertStatus[];
  from?: string;
  to?: string;
  host?: string;
  mitreTechnique?: string;
}
