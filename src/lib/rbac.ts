import type { UserRole } from "@/types";

export type Permission =
  | "alerts:read"
  | "alerts:write"
  | "hunt:run"
  | "incidents:manage"
  | "soar:run"
  | "reports:generate"
  | "admin:manage";

const rolePermissions: Record<UserRole, Permission[]> = {
  soc_manager: [
    "alerts:read",
    "alerts:write",
    "hunt:run",
    "incidents:manage",
    "soar:run",
    "reports:generate",
    "admin:manage"
  ],
  tenant_admin: ["alerts:read", "alerts:write", "hunt:run", "incidents:manage", "reports:generate", "admin:manage"],
  tier_3: ["alerts:read", "alerts:write", "hunt:run", "incidents:manage", "soar:run", "reports:generate"],
  tier_2: ["alerts:read", "alerts:write", "hunt:run", "incidents:manage", "reports:generate"],
  tier_1: ["alerts:read", "hunt:run"],
  viewer: ["alerts:read"]
};

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function roleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    soc_manager: "SOC Manager",
    tenant_admin: "Tenant Admin",
    tier_3: "Tier 3 Analyst",
    tier_2: "Tier 2 Analyst",
    tier_1: "Tier 1 Analyst",
    viewer: "Viewer"
  };
  return labels[role];
}
