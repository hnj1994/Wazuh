import { apiRequest, runtimeConfig } from "@/services/api/client";
import type { Alert, AlertSeverity, ChartPoint, SearchFilters } from "@/types";

interface OpenSearchHit<T> {
  _id: string;
  _source: T;
}

interface OpenSearchResponse<T> {
  hits?: {
    hits?: Array<OpenSearchHit<T>>;
  };
  aggregations?: Record<string, unknown>;
}

interface WazuhAlertSource {
  "@timestamp"?: string;
  timestamp?: string;
  rule?: {
    id?: string;
    level?: number;
    description?: string;
    groups?: string[];
    mitre?: {
      id?: string[];
      tactic?: string[];
      technique?: string[];
    };
  };
  agent?: {
    id?: string;
    name?: string;
    ip?: string;
  };
  data?: Record<string, unknown>;
  decoder?: { name?: string };
  location?: string;
  full_log?: string;
}

export function buildAlertSearchDsl(filters: SearchFilters) {
  const must: unknown[] = [];
  const filter: unknown[] = [
    {
      range: {
        "@timestamp": {
          gte: filters.from ?? "now-24h",
          lte: filters.to ?? "now"
        }
      }
    }
  ];

  if (filters.query) {
    must.push({
      query_string: {
        query: filters.query,
        default_operator: "AND"
      }
    });
  }

  if (filters.severities?.length) {
    const levelRanges: Record<AlertSeverity, unknown> = {
      critical: { range: { "rule.level": { gte: 14 } } },
      high: { range: { "rule.level": { gte: 11, lt: 14 } } },
      medium: { range: { "rule.level": { gte: 7, lt: 11 } } },
      low: { range: { "rule.level": { gte: 3, lt: 7 } } },
      informational: { range: { "rule.level": { lt: 3 } } }
    };
    filter.push({ bool: { should: filters.severities.map((severity) => levelRanges[severity]) } });
  }

  if (filters.host) {
    filter.push({ term: { "agent.name.keyword": filters.host } });
  }

  if (filters.mitreTechnique) {
    filter.push({ term: { "rule.mitre.id.keyword": filters.mitreTechnique } });
  }

  return {
    size: 200,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: {
      bool: {
        must,
        filter
      }
    }
  };
}

export async function searchOpenSearchAlerts(filters: SearchFilters, token?: string): Promise<Alert[]> {
  const body = buildAlertSearchDsl(filters);
  const payload = await apiRequest<OpenSearchResponse<WazuhAlertSource>>(
    `${runtimeConfig.opensearchProxyPath}/wazuh-alerts-*/_search`,
    {
      method: "POST",
      token,
      body: JSON.stringify(body)
    }
  );

  return (payload.hits?.hits ?? []).map((hit) => normalizeWazuhAlert(hit._id, filters.tenantId, hit._source));
}

export async function runOpenSearchDsl<T>(index: string, body: unknown, token?: string) {
  return apiRequest<OpenSearchResponse<T>>(`${runtimeConfig.opensearchProxyPath}/${index}/_search`, {
    method: "POST",
    token,
    body: JSON.stringify(body)
  });
}

export function normalizeWazuhAlert(id: string, tenantId: string, source: WazuhAlertSource): Alert {
  const level = source.rule?.level ?? 0;
  const severity: AlertSeverity =
    level >= 14 ? "critical" : level >= 11 ? "high" : level >= 7 ? "medium" : level >= 3 ? "low" : "informational";
  const mitreIds = source.rule?.mitre?.id ?? [];
  const mitreTechniques = source.rule?.mitre?.technique ?? [];
  const mitreTactics = source.rule?.mitre?.tactic ?? [];

  return {
    id,
    tenantId,
    timestamp: source["@timestamp"] ?? source.timestamp ?? new Date().toISOString(),
    severity,
    status: "new",
    riskScore: Math.min(99, Math.max(10, level * 7)),
    rule: {
      id: source.rule?.id ?? "unknown",
      level,
      description: source.rule?.description ?? "Wazuh alert",
      groups: source.rule?.groups ?? []
    },
    agent: {
      id: source.agent?.id ?? "unknown",
      name: source.agent?.name ?? "unknown",
      ip: source.agent?.ip ?? "unknown",
      os: "unknown"
    },
    source: {
      ip: String(source.data?.srcip ?? source.data?.src_ip ?? ""),
      user: String(source.data?.srcuser ?? source.data?.user ?? "")
    },
    decoder: source.decoder?.name ?? "wazuh",
    location: source.location ?? "wazuh-alerts",
    fullLog: source.full_log ?? JSON.stringify(source.data ?? {}),
    mitre: mitreIds.map((techniqueId, index) => ({
      tactic: mitreTactics[index] ?? "Unknown",
      tacticId: "",
      technique: mitreTechniques[index] ?? techniqueId,
      techniqueId,
      confidence: Math.min(95, Math.max(45, level * 6))
    })),
    tags: source.rule?.groups ?? [],
    raw: source as unknown as Record<string, unknown>
  };
}

export function summarizeSeverity(alerts: Alert[]): ChartPoint[] {
  const order: AlertSeverity[] = ["critical", "high", "medium", "low", "informational"];
  return order.map((severity) => ({
    name: severity[0].toUpperCase() + severity.slice(1),
    value: alerts.filter((alert) => alert.severity === severity).length
  }));
}
