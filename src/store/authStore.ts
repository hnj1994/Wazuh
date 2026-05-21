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
        const user = users.find((item) => item.email === normalizedEmail);
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

        const session: AuthSession = {
          token: `demo-${crypto.randomUUID()}`,
          user,
          activeTenantId,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
        };

        set({ session, loginError: undefined });
        return true;
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
    {
      name: "helios-ai-soc-auth"
    }
  )
);

export function useActiveTenant() {
  const session = useAuthStore((state) => state.session);
  const allTenants = useAuthStore((state) => state.tenants);
  return allTenants.find((tenant) => tenant.id === session?.activeTenantId) ?? allTenants[0];
}
