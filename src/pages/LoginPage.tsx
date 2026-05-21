import { FormEvent, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { runtimeConfig } from "@/services/api/client";
import { useAuthStore } from "@/store/authStore";

export function LoginPage() {
  const session = useAuthStore((state) => state.session);
  const tenants = useAuthStore((state) => state.tenants);
  const login = useAuthStore((state) => state.login);
  const loginError = useAuthStore((state) => state.loginError);
  const [email, setEmail] = useState("admin@soc.local");
  const [password, setPassword] = useState("admin123");
  const [tenantId, setTenantId] = useState(runtimeConfig.defaultTenant);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  const tenantOptions = useMemo(() => tenants, [tenants]);

  if (session) return <Navigate to="/dashboard" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const ok = await login(email, password, tenantId);
    setLoading(false);
    if (ok) navigate(from, { replace: true });
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 soc-grid opacity-60" />
      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex min-h-[42vh] flex-col justify-between border-r bg-card/70 p-6 backdrop-blur-xl md:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-primary/25 bg-primary/15 text-primary shadow-glow">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Helios AI SOC</p>
              <p className="text-sm text-muted-foreground">Self-hosted security operations workspace</p>
            </div>
          </div>

          <div className="my-12 max-w-3xl space-y-6">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Wazuh + OpenSearch + Ollama
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-normal text-balance md:text-6xl">
                AI-native SOC operations for open security teams.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Triage alerts, hunt threats, map MITRE coverage, generate reports, and coordinate response from one
                analyst workspace.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {["Live Wazuh alerts", "OpenSearch hunts", "Ollama copilot"].map((item) => (
              <div key={item} className="rounded-lg border bg-background/70 p-4">
                <p className="text-sm font-medium">{item}</p>
                <p className="mt-2 text-xs text-muted-foreground">Integrated in mock mode and ready for API proxying.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10">
          <Card className="w-full max-w-md bg-card/90 shadow-panel backdrop-blur-xl">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Use RBAC demo credentials or wire this page to your identity provider.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    Email
                  </label>
                  <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="tenant">
                    Tenant
                  </label>
                  <Select id="tenant" value={tenantId} onChange={(event) => setTenantId(event.target.value)}>
                    {tenantOptions.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {loginError ? <p className="text-sm text-destructive">{loginError}</p> : null}
                <Button className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Enter SOC"}
                </Button>
              </form>
              {runtimeConfig.useMocks ? (
                <div className="mt-5 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Demo users: admin@soc.local / admin123, analyst@soc.local / analyst123, viewer@soc.local / viewer123
                </div>
              ) : (
                <p className="mt-5 text-center text-xs text-muted-foreground">
                  Sign in with your Wazuh credentials.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
