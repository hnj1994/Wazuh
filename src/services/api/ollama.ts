import { apiRequest, runtimeConfig } from "@/services/api/client";
import type { Alert, ChatMessage, Incident } from "@/types";

interface OllamaChatResponse {
  message?: {
    role: string;
    content: string;
  };
  done?: boolean;
}

export async function chatWithOllama(messages: ChatMessage[], systemContext: string, token?: string) {
  const payload = await apiRequest<OllamaChatResponse>(`${runtimeConfig.ollamaProxyPath}/api/chat`, {
    method: "POST",
    token,
    body: JSON.stringify({
      model: runtimeConfig.ollamaModel,
      stream: false,
      messages: [
        {
          role: "system",
          content:
            "You are a senior SOC copilot. Be concise, evidence-led, and map detections to MITRE ATT&CK when useful.\n\n" +
            systemContext
        },
        ...messages.map((message) => ({ role: message.role, content: message.content }))
      ]
    })
  });

  return payload.message?.content ?? "Ollama returned an empty response.";
}

export async function generateAlertSummary(alert: Alert, token?: string) {
  const prompt = `Summarize this Wazuh alert for a SOC analyst. Include likely cause, affected asset, MITRE mapping, severity rationale, and 3 response actions.\n\n${JSON.stringify(alert, null, 2)}`;
  return chatWithOllama(
    [
      {
        id: `msg-${Date.now()}`,
        role: "user",
        content: prompt,
        timestamp: new Date().toISOString()
      }
    ],
    "Task: alert explanation",
    token
  );
}

export async function generateIncidentTimeline(incident: Incident, alerts: Alert[], token?: string) {
  const prompt = `Create a concise incident timeline from these alerts. Include timestamps, actor, asset, evidence, confidence, and next best action.\n\nIncident:\n${JSON.stringify(
    incident,
    null,
    2
  )}\n\nAlerts:\n${JSON.stringify(alerts, null, 2)}`;
  return chatWithOllama(
    [
      {
        id: `msg-${Date.now()}`,
        role: "user",
        content: prompt,
        timestamp: new Date().toISOString()
      }
    ],
    "Task: incident timeline generation",
    token
  );
}
