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
      host: "0.0.0.0",

      proxy: {
        // ── Wazuh REST API ──────────────────────────────────────────────────
        // In production, the Docker container's nginx handles this proxy and
        // injects proper credentials.  In dev mode, we forward directly so
        // the browser can reach Wazuh.  secure:false accepts self-signed certs.
        "/api/wazuh": {
          target: env.VITE_WAZUH_BASE_URL || "https://localhost:55000",
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/wazuh/, "")
        },

        // ── OpenSearch ──────────────────────────────────────────────────────
        "/api/opensearch": {
          target: env.VITE_OPENSEARCH_BASE_URL || "https://localhost:9200",
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/opensearch/, ""),
          // Dev only: inject Basic auth header so you don't need to set it in .env
          headers: env.VITE_OPENSEARCH_DEV_AUTH
            ? { Authorization: `Basic ${env.VITE_OPENSEARCH_DEV_AUTH}` }
            : {}
        },

        // ── Ollama AI ───────────────────────────────────────────────────────
        "/api/ollama": {
          target: env.VITE_OLLAMA_BASE_URL || "http://localhost:11434",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/ollama/, "")
        }
      }
    },

    build: {
      // Emit source maps only in CI (set VITE_SOURCE_MAP=true)
      sourcemap: env.VITE_SOURCE_MAP === "true",
      rollupOptions: {
        output: {
          // Split vendor code into a separate chunk for better browser caching
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            charts: ["recharts"],
            ui: ["lucide-react", "clsx", "tailwind-merge", "class-variance-authority"]
          }
        }
      }
    }
  };
});
