import { Activity, Cpu, HardDrive, Server } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSocStore } from "@/store/socStore";

function statusBadge(status: string) {
  const classes: Record<string, string> = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    disconnected: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    never_connected: "border-slate-500/30 bg-slate-500/10 text-slate-300"
  };
  return classes[status] ?? classes.pending;
}

export function AgentsPage() {
  const session = useAuthStore((state) => state.session);
  const agents = useSocStore((state) => state.agents);
  const loadDashboard = useSocStore((state) => state.loadDashboard);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!session || agents.length) return;
    void loadDashboard(session.activeTenantId, session.token);
  }, [agents.length, loadDashboard, session?.activeTenantId, session?.token]);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return agents.filter((agent) =>
      [agent.name, agent.ip, agent.os, agent.group, agent.status].join(" ").toLowerCase().includes(normalized)
    );
  }, [agents, query]);

  const activeCount = agents.filter((agent) => agent.status === "active").length;
  const alertTotal = agents.reduce((sum, agent) => sum + agent.alertCount24h, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Endpoint Activity"
        title="Wazuh Agents"
        description="Monitor endpoint status, alert volume, resource telemetry, and host groups across tenants."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardContent className="p-5">
            <Server className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Total agents</p>
            <p className="mt-1 text-3xl font-semibold">{agents.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardContent className="p-5">
            <Activity className="h-5 w-5 text-emerald-300" />
            <p className="mt-3 text-sm text-muted-foreground">Active</p>
            <p className="mt-1 text-3xl font-semibold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardContent className="p-5">
            <HardDrive className="h-5 w-5 text-amber-300" />
            <p className="mt-3 text-sm text-muted-foreground">Alerts 24h</p>
            <p className="mt-1 text-3xl font-semibold">{alertTotal}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardContent className="p-5">
            <Cpu className="h-5 w-5 text-sky-300" />
            <p className="mt-3 text-sm text-muted-foreground">Avg CPU</p>
            <p className="mt-1 text-3xl font-semibold">
              {agents.length ? Math.round(agents.reduce((sum, agent) => sum + agent.cpu, 0) / agents.length) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Endpoint Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by host, group, IP, OS, or status..."
            className="max-w-lg"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Host</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Alerts 24h</TableHead>
                <TableHead>Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">agent {agent.id} · {agent.version}</p>
                  </TableCell>
                  <TableCell>{agent.ip}</TableCell>
                  <TableCell>{agent.os}</TableCell>
                  <TableCell>{agent.group}</TableCell>
                  <TableCell>
                    <span className={`rounded-md border px-2 py-0.5 text-xs ${statusBadge(agent.status)}`}>
                      {agent.status}
                    </span>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <Progress value={agent.cpu} />
                      <span className="w-9 text-xs text-muted-foreground">{agent.cpu}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <Progress value={agent.memory} />
                      <span className="w-9 text-xs text-muted-foreground">{agent.memory}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{agent.alertCount24h}</Badge>
                  </TableCell>
                  <TableCell>{timeAgo(agent.lastSeen)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
