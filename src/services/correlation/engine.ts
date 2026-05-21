import type { Alert, Incident, TimelineEvent } from "@/types";

const WINDOW_MS = 6 * 60 * 60 * 1000;

export function correlateAlerts(alerts: Alert[], tenantId: string): Incident[] {
  const sorted = alerts
    .filter((alert) => alert.tenantId === tenantId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const groups = new Map<string, Alert[]>();

  for (const alert of sorted) {
    const key = [
      alert.agent.name,
      alert.source.user ?? "no-user",
      alert.mitre[0]?.techniqueId ?? alert.rule.groups[0] ?? "generic"
    ].join("|");
    const bucket = groups.get(key) ?? [];
    const newest = bucket[0];
    if (!newest || Math.abs(new Date(newest.timestamp).getTime() - new Date(alert.timestamp).getTime()) <= WINDOW_MS) {
      bucket.push(alert);
      groups.set(key, bucket);
    }
  }

  return Array.from(groups.entries())
    .filter(([, group]) => group.length > 1 || group.some((alert) => alert.riskScore >= 80))
    .map(([key, group], index) => buildIncident(key, group, index, tenantId));
}

function buildIncident(key: string, group: Alert[], index: number, tenantId: string): Incident {
  const sorted = group.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const riskScore = Math.max(...sorted.map((alert) => alert.riskScore));
  const severity = sorted.find((alert) => alert.riskScore === riskScore)?.severity ?? "medium";
  const [host, user, technique] = key.split("|");
  const timeline: TimelineEvent[] = sorted.map((alert) => ({
    id: `corr-${alert.id}`,
    timestamp: alert.timestamp,
    title: alert.rule.description,
    description: alert.fullLog,
    severity: alert.severity,
    actor: alert.source.user ?? alert.source.ip,
    asset: alert.agent.name,
    evidence: [alert.id]
  }));

  return {
    id: `CORR-${Date.now()}-${index + 1}`,
    tenantId,
    title: `Correlated ${technique} activity on ${host}`,
    status: "new",
    severity,
    riskScore,
    owner: "Unassigned",
    createdAt: sorted[0]?.timestamp ?? new Date().toISOString(),
    updatedAt: sorted[sorted.length - 1]?.timestamp ?? new Date().toISOString(),
    affectedAssets: Array.from(new Set(sorted.map((alert) => alert.agent.name))),
    relatedAlertIds: sorted.map((alert) => alert.id),
    mitre: sorted.flatMap((alert) => alert.mitre).slice(0, 4),
    summary: `Correlation engine grouped ${sorted.length} alerts involving ${user} on ${host}. Highest risk score is ${riskScore}.`,
    timeline,
    recommendedActions: [
      "Validate the principal and asset owner.",
      "Review surrounding authentication, process, and network telemetry.",
      "Escalate if the activity is unauthorized or crosses multiple tactics."
    ]
  };
}
