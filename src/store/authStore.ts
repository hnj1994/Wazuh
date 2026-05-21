import { create } from "zustand";
import { persist } from "zustand/middleware";
import { demoCredentials, tenants, users } from "@/data/demoData";
import { runtimeConfig } from "@/services/api/client";
import type { AuthSession, Tenant } from "@/types";

interface AuthState {
  session?: AuthSession;
  tenants: Tenant[];
  loginError?: string;
  login: (email: string, password: string, tenantId?: string) => Promise<boolean>;
  logout: () => void;
  setActiveTenant: (tenantId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tenants,

      async login(email, password, tenantId) {
        const normalizedEmail = email.trim().toLowerCase();

        // ── Demo / mock mode ─────────────────────────────────────────────────
        if (runtimeConfig.useMocks) {
          const user = users.find((u) => u.email === normalizedEmail);
          const expected = demoCredentials[normalizedEmail];

          if (!user || expected !== password) {
            set({ loginError: "Invalid SOC user credentials." });
            return false;
          }

          const activeTenantId =
            tenantId && user.tenantIds.includes(tenantId)
              ? tenantId
              : user.tenantIds.includes(runtimeConfig.defaultTenant)
                ? runtimeConfig.defaultTenant
                : user.tenantIds[0];

          set({
            session: {
              token: `demo-${crypto.randomUUID()}`,
              user,
              activeTenantId,
              expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
            },
            loginError: undefined
          });
          return true;
        }

        // ── Live mode: authenticate against Wazuh API ────────────────────────
        // Wazuh issues a JWT via Basic-auth on the /security/user/authenticate
        // endpoint.  That JWT is then used as Bearer for all subsequent API
        // calls and is forwarded transparently by the nginx proxy.
        try {
          const resp = await fetch(
            `${runtimeConfig.wazuhProxyPath}/security/user/authenticate`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`${normalizedEmail}:${password}`)}`,
                "Content-Type": "application/json"
              }
            }
          );

          if (!resp.ok) {
            set({ loginError: "Invalid credentials or Wazuh unavailable. Check connectivity." });
            return false;
          }

          const data: { data?: { token?: string } } = await resp.json();
          const wazuhToken = data.data?.token;

          if (!wazuhToken) {
            set({ loginError: "Authentication failed: no token received from Wazuh." });
            return false;
          }

          const resolvedTenantId = tenantId ?? runtimeConfig.defaultTenant;
          // Wazuh JWT TTL defaults to 900 s; prompt re-login after 14 min
          const session: AuthSession = {
            token: wazuhToken,
            user: {
              id: normalizedEmail,
              name: normalizedEmail,
              email: normalizedEmail,
              role: "tier_2",
              tenantIds: [resolvedTenantId]
            },
            activeTenantId: resolvedTenantId,
            expiresAt: new Date(Date.now() + 14 * 60 * 1000).toISOString()
          };

          set({ session, loginError: undefined });
          return true;
        } catch {
          set({ loginError: "Cannot reach authentication service. Verify network and Wazuh status." });
          return false;
        }
      },

      logout() {
        set({ session: undefined, loginError: undefined });
      },

      setActiveTenant(tenantId) {
        const session = get().session;
        if (!session || !session.user.tenantIds.includes(tenantId)) return;
        set({ session: { ...session, activeTenantId: tenantId } });
      }
    }),
    { name: "helios-ai-soc-auth" }
  )
);

export function useActiveTenant() {
  const session = useAuthStore((state) => state.session);
  const allTenants = useAuthStore((state) => state.tenants);
  return allTenants.find((t) => t.id === session?.activeTenantId) ?? allTenants[0];
}
