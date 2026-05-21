export const runtimeConfig = {
  appName: import.meta.env.VITE_APP_NAME || "Helios AI SOC",
  useMocks: import.meta.env.VITE_USE_MOCKS !== "false",
  wazuhProxyPath: import.meta.env.VITE_WAZUH_PROXY_PATH || "/api/wazuh",
  opensearchProxyPath: import.meta.env.VITE_OPENSEARCH_PROXY_PATH || "/api/opensearch",
  ollamaProxyPath: import.meta.env.VITE_OLLAMA_PROXY_PATH || "/api/ollama",
  wazuhWsUrl: import.meta.env.VITE_WAZUH_WS_URL || "",
  ollamaModel: import.meta.env.VITE_OLLAMA_MODEL || "llama3.1:8b",
  defaultTenant: import.meta.env.VITE_DEFAULT_TENANT || "apex"
};

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

interface ApiRequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(`Request failed: ${response.status}`, response.status, payload);
  }

  return payload as T;
}
