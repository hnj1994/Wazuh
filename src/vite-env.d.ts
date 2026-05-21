/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_USE_MOCKS?: string;
  readonly VITE_WAZUH_PROXY_PATH?: string;
  readonly VITE_OPENSEARCH_PROXY_PATH?: string;
  readonly VITE_OLLAMA_PROXY_PATH?: string;
  readonly VITE_WAZUH_BASE_URL?: string;
  readonly VITE_OPENSEARCH_BASE_URL?: string;
  readonly VITE_OLLAMA_BASE_URL?: string;
  readonly VITE_WAZUH_WS_URL?: string;
  readonly VITE_OLLAMA_MODEL?: string;
  readonly VITE_DEFAULT_TENANT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
