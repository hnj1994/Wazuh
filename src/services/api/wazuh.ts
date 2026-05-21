import { apiRequest, runtimeConfig } from "@/services/api/client";
import type { Agent } from "@/types";

interface WazuhAgentResponse {
  data?: {
    affected_items?: Array<{
      id: string;
      name: string;
      ip?: string;
      os?: { name?: string; platform?: string };
      version?: string;
      status?: string;
      group?: string[];
      dateAdd?: string;
      lastKeepAlive?: string;
    }>;
  };
}

export async function fetchWazuhAgents(tenantId: string, token?: string): Promise<Agent[]> {
  const payload = await apiRequest<WazuhAgentResponse>(
    `${runtimeConfig.wazuhProxyPath}/agents?limit=500&select=id,name,ip,os.name,version,status,group,lastKeepAlive`,
    { token }
  );

  return (payload.data?.affected_items ?? []).map((item) => ({
    id: item.id,
    tenantId,
    name: item.name,
    ip: item.ip ?? "unknown",
    os: item.os?.name ?? item.os?.platform ?? "unknown",
    version: item.version ?? "unknown",
    status: item.status === "active" ? "active" : item.status === "disconnected" ? "disconnected" : "pending",
    group: item.group?.[0] ?? "default",
    lastSeen: item.lastKeepAlive ?? item.dateAdd ?? new Date().toISOString(),
    cpu: 0,
    memory: 0,
    alertCount24h: 0
  }));
}

export async function fetchWazuhVulnerabilities(agentId: string, token?: string) {
  return apiRequest(
    `${runtimeConfig.wazuhProxyPath}/vulnerability/${agentId}?limit=100&sort=-severity`,
    { token }
  );
}

export async function fetchWazuhSyscollector(agentId: string, token?: string) {
  return apiRequest(`${runtimeConfig.wazuhProxyPath}/syscollector/${agentId}/processes?limit=100`, { token });
}
