import {
  agents,
  alertTrend,
  alerts,
  buildDemoReport,
  dashboardMetrics,
  failedLogins,
  huntQueries,
  huntResults,
  incidents,
  malwareDetections,
  mitreTechniques,
  networkActivity,
  playbooks,
  severityChart,
  tenants,
  threatIntel,
  topHosts
} from "@/data/demoData";
import { buildAlertExplanation, translateNaturalLanguage } from "@/lib/queryLanguage";
import type {
  Alert,
  ChatMessage,
  DashboardData,
  HuntResult,
  SearchFilters,
  SoarPlaybook,
  ThreatIntelIndicator
} from "@/types";

const delay = (ms = 220) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const mockApi = {
  async getDashboardData(tenantId: string): Promise<DashboardData> {
    await delay();
    const tenantAlerts = alerts.filter((alert) => alert.tenantId === tenantId);
    return {
      metrics: dashboardMetrics,
      severity: severityChart,
      alertTrend,
      topHosts,
      failedLogins,
      malwareDetections,
      networkActivity,
      agents: agents.filter((agent) => agent.tenantId === tenantId),
      alerts: tenantAlerts,
      incidents: incidents.filter((incident) => incident.tenantId === tenantId),
      mitre: mitreTechniques,
      playbooks
    };
  },

  async searchAlerts(filters: SearchFilters): Promise<Alert[]> {
    await delay(160);
    const query = filters.query?.toLowerCase().trim();
    return alerts.filter((alert) => {
      if (alert.tenantId !== filters.tenantId) return false;
      if (filters.severities?.length && !filters.severities.includes(alert.severity)) return false;
      if (filters.status?.length && !filters.status.includes(alert.status)) return false;
      if (filters.host && alert.agent.name !== filters.host) return false;
      if (filters.mitreTechnique && !alert.mitre.some((item) => item.techniqueId === filters.mitreTechnique)) {
        return false;
      }
      if (!query) return true;
      const haystack = [
        alert.id,
        alert.rule.description,
        alert.agent.name,
        alert.fullLog,
        alert.source.ip,
        alert.source.user,
        alert.process?.name,
        alert.process?.commandLine,
        ...alert.tags,
        ...alert.mitre.map((item) => `${item.techniqueId} ${item.technique}`)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query.replace(/\*/g, ""));
    });
  },

  async getAlert(alertId: string): Promise<Alert | undefined> {
    await delay(120);
    return alerts.find((alert) => alert.id === alertId || alert.id.startsWith(alertId));
  },

  async getAgents(tenantId: string) {
    await delay(140);
    return agents.filter((agent) => agent.tenantId === tenantId);
  },

  async runHunt(query: string, tenantId: string): Promise<HuntResult[]> {
    await delay(260);
    const translated = translateNaturalLanguage(query);
    const normalized = `${translated.query} ${query}`.toLowerCase();
    const tenantHosts = new Set(agents.filter((agent) => agent.tenantId === tenantId).map((agent) => agent.name));
    return huntResults.filter((result) => {
      if (!tenantHosts.has(result.host)) return false;
      if (normalized.includes("powershell")) return result.message.toLowerCase().includes("powershell");
      if (normalized.includes("failed") || normalized.includes("authentication")) {
        return result.eventType === "authentication";
      }
      if (normalized.includes("network") || normalized.includes("exfil") || normalized.includes("outbound")) {
        return result.eventType === "network";
      }
      return true;
    });
  },

  async getHuntQueries() {
    await delay(80);
    return huntQueries;
  },

  async getMitreCoverage() {
    await delay(120);
    return mitreTechniques;
  },

  async getPlaybooks(): Promise<SoarPlaybook[]> {
    await delay(120);
    return playbooks;
  },

  async runPlaybook(playbookId: string): Promise<SoarPlaybook | undefined> {
    await delay(520);
    return playbooks.find((playbook) => playbook.id === playbookId);
  },

  async enrichIndicator(value: string): Promise<ThreatIntelIndicator> {
    await delay(260);
    const existing = threatIntel.find((indicator) => indicator.value.toLowerCase() === value.toLowerCase());
    if (existing) return existing;
    return {
      value,
      type: value.includes(".") ? "ip" : value.length > 32 ? "hash" : "domain",
      reputation: "unknown",
      confidence: 35,
      sources: ["Local cache"],
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      tags: ["unclassified"]
    };
  },

  async getThreatIntel() {
    await delay(120);
    return threatIntel;
  },

  async generateReport(tenantId: string) {
    await delay(500);
    return buildDemoReport(tenantId);
  },

  async askAssistant(messages: ChatMessage[], tenantId: string, selectedAlert?: Alert): Promise<string> {
    await delay(480);
    const last = messages[messages.length - 1]?.content ?? "";
    const translated = translateNaturalLanguage(last);
    const tenant = tenants.find((item) => item.id === tenantId);

    if (selectedAlert && translated.intent === "explain_alert") {
      return buildAlertExplanation(selectedAlert);
    }

    if (translated.intent === "failed_logins") {
      return `I translated that into:\n\n${translated.query}\n\nResult preview for ${tenant?.name}: 390 failed logon signals in the last day, with the highest-risk cluster targeting dc-01 and account svc_backup. The sequence in WAZUH-10031 includes repeated 4625 failures followed by a successful 4624 Type 10 logon, so I would escalate it as possible credential stuffing.`;
    }

    if (translated.intent === "powershell") {
      return `Suspicious PowerShell is currently concentrated on fin-vdi-044. The strongest hit is WAZUH-10032: WINWORD.EXE spawned powershell.exe with -EncodedCommand and execution policy bypass. MITRE mapping: T1059.001 and likely T1027. Recommended next steps: isolate the workstation, decode the command, collect Office recent files, and inspect outbound connections after execution.`;
    }

    if (translated.intent === "network") {
      return `The notable network anomaly is WAZUH-10037: 1.8GB outbound TLS traffic from fin-vdi-044 through vpn-gw-01 to 198.51.100.77 on TCP/8443. That aligns with T1567 Exfiltration Over Web Service. I would block the destination, preserve proxy/VPN logs, and compare the transfer window with endpoint process telemetry.`;
    }

    if (translated.intent === "malware") {
      return `Malware detections are mostly quarantined, but WAZUH-10035 is connected to the same workstation that launched encoded PowerShell. Defender quarantined Trojan:Win32/PhishLoader.A from an Excel macro file. Treat the endpoint as suspect until memory, autoruns, and recent network sessions are reviewed.`;
    }

    return `I can help with that. I have current context for ${tenant?.name ?? "the active tenant"} across Wazuh alerts, OpenSearch hunts, MITRE coverage, incidents, and SOAR workflows. Try asking for failed logins, suspicious PowerShell, malware detections, network exfiltration, or to explain a selected alert.`;
  }
};
