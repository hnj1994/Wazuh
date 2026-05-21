import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    server: {
      port: Number(env.VITE_DEV_PORT ?? 5173),
      proxy: {
        "/api/wazuh": {
          target: env.VITE_WAZUH_BASE_URL || "https://wazuh.example.local:55000",
          changeOrigin: true,
          secure: false,
          rewrite: (pathName) => pathName.replace(/^\/api\/wazuh/, "")
        },
        "/api/opensearch": {
          target: env.VITE_OPENSEARCH_BASE_URL || "https://opensearch.example.local:9200",
          changeOrigin: true,
          secure: false,
          rewrite: (pathName) => pathName.replace(/^\/api\/opensearch/, "")
        },
        "/api/ollama": {
          target: env.VITE_OLLAMA_BASE_URL || "http://localhost:11434",
          changeOrigin: true,
          rewrite: (pathName) => pathName.replace(/^\/api\/ollama/, "")
        }
      }
    }
  };
});
