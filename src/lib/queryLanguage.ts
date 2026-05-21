import type { Alert, HuntQuery } from "@/types";

export interface NaturalLanguageQuery {
  intent: "failed_logins" | "powershell" | "malware" | "network" | "explain_alert" | "generic";
  title: string;
  query: string;
  language: HuntQuery["language"];
  explanation: string;
}

export function translateNaturalLanguage(input: string): NaturalLanguageQuery {
  const normalized = input.toLowerCase();

  if (normalized.includes("failed") && normalized.includes("login")) {
    return {
      intent: "failed_logins",
      title: "Failed logins in last 24 hours",
      query: 'rule.groups:("authentication_failed" OR "pam") AND timestamp:[now-24h TO now]',
      language: "lucene",
      explanation: "Searches Wazuh authentication failure groups over the last 24 hours."
    };
  }

  if (normalized.includes("powershell")) {
    return {
      intent: "powershell",
      title: "Suspicious PowerShell activity",
      query:
        'process.name:powershell.exe AND process.command_line:(*EncodedCommand* OR *DownloadString* OR *Bypass*)',
      language: "lucene",
      explanation: "Finds PowerShell executions that commonly appear in payload delivery and defense evasion."
    };
  }

  if (normalized.includes("malware") || normalized.includes("defender") || normalized.includes("virus")) {
    return {
      intent: "malware",
      title: "Malware detections",
      query: 'rule.groups:(malware OR windows_defender) AND timestamp:[now-7d TO now]',
      language: "lucene",
      explanation: "Looks for AV and Wazuh malware groups in the recent alert index."
    };
  }

  if (normalized.includes("network") || normalized.includes("exfil") || normalized.includes("outbound")) {
    return {
      intent: "network",
      title: "Suspicious network activity",
      query: '{"query":{"bool":{"must":[{"range":{"flow.bytes_toserver":{"gte":500000000}}}]}}}',
      language: "dsl",
      explanation: "Highlights high-volume outbound sessions that can indicate staging or exfiltration."
    };
  }

  if (normalized.includes("explain") || normalized.includes("summarize")) {
    return {
      intent: "explain_alert",
      title: "Alert explanation",
      query: "Explain selected alert with evidence, impact, and next steps.",
      language: "natural",
      explanation: "Uses the active alert context and asks Ollama for an analyst-ready explanation."
    };
  }

  return {
    intent: "generic",
    title: "General SOC query",
    query: input,
    language: "natural",
    explanation: "Routes the request to the SOC copilot with current alert and incident context."
  };
}

export function buildAlertExplanation(alert: Alert) {
  const mitre = alert.mitre.map((item) => `${item.techniqueId} ${item.technique}`).join(", ");
  return [
    `Alert ${alert.id}: ${alert.rule.description}`,
    `Severity ${alert.severity}, risk ${alert.riskScore}, host ${alert.agent.name} (${alert.agent.ip}).`,
    mitre ? `MITRE mapping: ${mitre}.` : "No MITRE mapping was attached.",
    `Evidence: ${alert.fullLog}`,
    "Recommended response: validate account ownership, inspect related process/network activity, contain the affected asset if malicious behavior is confirmed, and document evidence in the incident timeline."
  ].join("\n\n");
}

export function buildSocContext(alerts: Alert[]) {
  return alerts
    .slice(0, 8)
    .map(
      (alert) =>
        `${alert.id} | ${alert.severity} | risk ${alert.riskScore} | ${alert.agent.name} | ${alert.rule.description}`
    )
    .join("\n");
}
