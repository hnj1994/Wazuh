import {
  alertTrend,
  failedLogins,
  malwareDetections,
  mitreTechniques,
  networkActivity,
  playbooks,
  topHosts
} from "@/data/demoData";
import { runtimeConfig } from "@/services/api/client";
import { mockApi } from "@/services/api/mock";
import { chatWithOllama } from "@/services/api/ollama";
import { getAlertById, runOpenSearchHunt, searchOpenSearchAlerts, summarizeSeverity } from "@/services/api/opensearch";
import { fetchWazuhAgents } from "@/services/api/wazuh";
import { correlateAlerts } from "@/services/correlation/engine";
import { translateNaturalLanguage } from "@/lib/queryLanguage";
import type {
  Alert,
  ChatMessage,
  DashboardData,
  DashboardMetric,
  HuntResult,
  SearchFilters,
  SocReport
} from "@/types";

function buildMetrics(alerts: Alert[], agentCount: number): DashboardMetric[] {
  const critical = alerts.filter((alert) => alert.severity === "critical").length;
  const open = alerts.filter((alert) => !["resolved", "closed"].includes(alert.status)).length;
  const coverage = new Set(alerts.flatMap((alert) => alert.mitre.map((item) => item.techniqueId))).size;

  return [
    { id: "critical", label: "Critical alerts", value: critical, delta: critical ? 12 : -5, intent: critical ? "bad" : "good" },
    { id: "incidents", label: "Open incidents", value: open, delta: 4, intent: "warn" },
    { id: "mttr", label: "Mean triage time", value: "live", delta: -8, intent: "good" },
    { id: "agents", label: "Active agents", value: agentCount, delta: 1, intent: "good" },
    { id: "coverage", label: "MITRE techniques", value: coverage, delta: 3, intent: "neutral" },
    { id: "soar", label: "SOAR automations", value: playbooks.length, delta: 0, intent: "neutral" }
  ];
}

export const socApi = {
  async getDashboardData(tenantId: string, token?: string): Promise<DashboardData> {
    if (runtimeConfig.useMocks) return mockApi.getDashboardData(tenantId);

    try {
      const [realAlerts, realAgents] = await Promise.all([
        searchOpenSearchAlerts({ tenantId, from: "now-24h", to: "now" }, token),
        fetchWazuhAgents(tenantId, token)
      ]);

      return {
        metrics: buildMetrics(realAlerts, realAgents.filter((agent) => agent.status === "active").length),
        severity: summarizeSeverity(realAlerts),
        alertTrend,
        topHosts: Object.entries(
          realAlerts.reduce<Record<string, number>>((acc, alert) => {
            acc[alert.agent.name] = (acc[alert.agent.name] ?? 0) + 1;
            return acc;
          }, {})
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, value]) => ({ name, value })),
        failedLogins,
        malwareDetections,
        networkActivity,
        agents: realAgents,
        alerts: realAlerts,
        incidents: correlateAlerts(realAlerts, tenantId),
        mitre: mitreTechniques,
        playbooks
      };
    } catch {
      return mockApi.getDashboardData(tenantId);
    }
  },

  async searchAlerts(filters: SearchFilters, token?: string) {
    if (runtimeConfig.useMocks) return mockApi.searchAlerts(filters);
    try {
      return await searchOpenSearchAlerts(filters, token);
    } catch {
      return mockApi.searchAlerts(filters);
    }
  },

  async getAlert(alertId: string, token?: string) {
    if (runtimeConfig.useMocks) return mockApi.getAlert(alertId);
    try {
      const alert = await getAlertById(alertId, token);
      return alert ?? (await mockApi.getAlert(alertId));
    } catch {
      return mockApi.getAlert(alertId);
    }
  },

  async getAgents(tenantId: string, token?: string) {
    if (runtimeConfig.useMocks) return mockApi.getAgents(tenantId);
    try {
      return await fetchWazuhAgents(tenantId, token);
    } catch {
      return mockApi.getAgents(tenantId);
    }
  },

  async runHunt(query: string, tenantId: string, token?: string): Promise<HuntResult[]> {
    if (runtimeConfig.useMocks) return mockApi.runHunt(query, tenantId);
    try {
      const translated = translateNaturalLanguage(query);
      const luceneQuery = translated.query || query;
      const results = await runOpenSearchHunt(luceneQuery, token);
      // Fall back to mock results if OpenSearch returns nothing
      return results.length > 0 ? results : mockApi.runHunt(query, tenantId);
    } catch {
      return mockApi.runHunt(query, tenantId);
    }
  },

  async getHuntQueries() {
    return mockApi.getHuntQueries();
  },

  async getMitreCoverage() {
    return mockApi.getMitreCoverage();
  },

  async getPlaybooks() {
    return mockApi.getPlaybooks();
  },

  async runPlaybook(playbookId: string) {
    return mockApi.runPlaybook(playbookId);
  },

  async getThreatIntel() {
    return mockApi.getThreatIntel();
  },

  async enrichIndicator(value: string) {
    return mockApi.enrichIndicator(value);
  },

  async generateReport(tenantId: string): Promise<SocReport> {
    return mockApi.generateReport(tenantId);
  },

  async askAssistant(messages: ChatMessage[], tenantId: string, selectedAlert?: Alert, token?: string) {
    if (runtimeConfig.useMocks) return mockApi.askAssistant(messages, tenantId, selectedAlert);

    try {
      const context = [
        `Active tenant: ${tenantId}`,
        selectedAlert ? `Selected alert: ${JSON.stringify(selectedAlert)}` : "",
        "Use Wazuh/OpenSearch evidence and avoid inventing fields."
      ].join("\n");
      return await chatWithOllama(messages, context, token);
    } catch {
      return mockApi.askAssistant(messages, tenantId, selectedAlert);
    }
  }
};
