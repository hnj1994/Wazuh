import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";

export function TenantSwitcher() {
  const session = useAuthStore((state) => state.session);
  const tenants = useAuthStore((state) => state.tenants);
  const setActiveTenant = useAuthStore((state) => state.setActiveTenant);

  const allowedTenants = tenants.filter((tenant) => session?.user.tenantIds.includes(tenant.id));

  return (
    <Select
      className="h-9 w-[180px] bg-muted/40"
      value={session?.activeTenantId}
      onChange={(event) => setActiveTenant(event.target.value)}
      aria-label="Tenant"
    >
      {allowedTenants.map((tenant) => (
        <option key={tenant.id} value={tenant.id}>
          {tenant.name}
        </option>
      ))}
    </Select>
  );
}
