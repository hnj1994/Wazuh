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
  /**
   * Maximum retry attempts on network errors or 5xx responses.
   * Client errors (4xx) are never retried.  Default: 1.
   */
  retries?: number;
  /** Request timeout in milliseconds.  Default: 30 000. */
  timeoutMs?: number;
}

export async function apiRequest<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, retries = 1, timeoutMs = 30_000, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  headers.set("Accept", "application/json");
  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...fetchOptions, headers, signal: controller.signal });
    window.clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type");
    const payload = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new ApiError(`Request failed: ${response.status}`, response.status, payload);
    }

    return payload as T;
  } catch (err) {
    window.clearTimeout(timeoutId);

    // Retry on network / timeout errors or server errors (5xx), not on 4xx.
    const isRetryable = !(err instanceof ApiError) || err.status >= 500;

    if (retries > 0 && isRetryable) {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      return apiRequest<T>(url, { ...options, retries: retries - 1 });
    }

    throw err;
  }
}
