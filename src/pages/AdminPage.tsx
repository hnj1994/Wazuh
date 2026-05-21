import { KeyRound, Layers3, PlugZap, UsersRound } from "lucide-react";
import { tenants, users } from "@/data/demoData";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasPermission, roleLabel, type Permission } from "@/lib/rbac";
import { runtimeConfig } from "@/services/api/client";
import type { UserRole } from "@/types";

const permissions: Permission[] = [
  "alerts:read",
  "alerts:write",
  "hunt:run",
  "incidents:manage",
  "soar:run",
  "reports:generate",
  "admin:manage"
];

const roles: UserRole[] = ["soc_manager", "tenant_admin", "tier_3", "tier_2", "tier_1", "viewer"];

export function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform Administration"
        title="Tenants, RBAC, and Integrations"
        description="Manage multi-tenant SOC access, role permissions, API proxy routes, and production integration posture."
      />

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-primary" />
              Tenants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="rounded-lg border bg-muted/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{tenant.region} · {tenant.retentionDays} day retention</p>
                  </div>
                  <Badge variant="outline">{tenant.plan}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-primary" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tenants</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell>{roleLabel(user.role)}</TableCell>
                    <TableCell>{user.tenantIds.join(", ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            RBAC Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                {permissions.map((permission) => (
                  <TableHead key={permission}>{permission}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role}>
                  <TableCell className="font-medium">{roleLabel(role)}</TableCell>
                  {permissions.map((permission) => (
                    <TableCell key={`${role}-${permission}`}>
                      {hasPermission(role, permission) ? (
                        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">allow</Badge>
                      ) : (
                        <Badge variant="subtle">deny</Badge>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-card/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlugZap className="h-4 w-4 text-primary" />
            Integration Routes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            ["Wazuh API", runtimeConfig.wazuhProxyPath],
            ["OpenSearch API", runtimeConfig.opensearchProxyPath],
            ["Ollama API", runtimeConfig.ollamaProxyPath]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border bg-muted/25 p-4">
              <p className="text-sm font-medium">{label}</p>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{value}</p>
              <Badge className="mt-3 border-sky-500/30 bg-sky-500/10 text-sky-300" variant="outline">
                proxy required
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
