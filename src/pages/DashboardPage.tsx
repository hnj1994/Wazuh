import {
  AlertTriangle,
  BrainCircuit,
  Clock3,
  Crosshair,
  RefreshCw,
  Server,
  ShieldCheck,
  Workflow
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartFrame } from "@/components/dashboard/ChartFrame";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, riskTone, statusTone, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSocStore } from "@/store/socStore";

const metricIcons = [AlertTriangle, BrainCircuit, Clock3, Server, Crosshair, Workflow];
const chartColors = ["#f43f5e", "#fb923c", "#f59e0b", "#38bdf8", "#94a3b8"];

function tooltipStyle() {
  return {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))"
  };
}

export function DashboardPage() {
  const session = useAuthStore((state) => state.session);
  const dashboard = useSocStore((state) => state.dashboard);
  const loading = useSocStore((state) => state.loading);
  const loadDashboard = useSocStore((state) => state.loadDashboard);
  const selectAlert = useSocStore((state) => state.selectAlert);

  const data = dashboard;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Unified SOC Command"
        title="Operations Dashboard"
        description="Live alert flow, identity pressure, endpoint health, MITRE coverage, and active investigations across the selected tenant."
        actions={
          <Button
            variant="outline"
            onClick={() => session && void loadDashboard(session.activeTenantId, session.token)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {(data?.metrics ?? []).map((metric, index) => (
          <MetricCard key={metric.id} metric={metric} icon={metricIcons[index] ?? ShieldCheck} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <ChartFrame title="Alert Velocity" description="Stacked severity trend from OpenSearch alert indices.">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.alertTrend ?? []}>
                <defs>
                  <linearGradient id="critical" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="high" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="medium" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Area dataKey="medium" stackId="1" stroke="#f59e0b" fill="url(#medium)" />
                <Area dataKey="high" stackId="1" stroke="#fb923c" fill="url(#high)" />
                <Area dataKey="critical" stackId="1" stroke="#f43f5e" fill="url(#critical)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>

        <ChartFrame title="Severity Mix" description="Current Wazuh alert distribution.">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.severity ?? []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={68}
                  outerRadius={104}
                  paddingAngle={3}
                >
                  {(data?.severity ?? []).map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartFrame title="Top Attacked Hosts" description="Hosts by alert count.">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topHosts ?? []} layout="vertical" margin={{ left: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Bar dataKey="value" fill="#14b8a6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>

        <ChartFrame title="Failed Logins" description="Authentication failures by day.">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.failedLogins ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>

        <ChartFrame title="Network Activity" description="Inbound and outbound volume.">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.networkActivity ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Area type="monotone" dataKey="inbound" stroke="#38bdf8" fill="#38bdf855" />
                <Area type="monotone" dataKey="outbound" stroke="#a78bfa" fill="#a78bfa44" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Live Alert Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.alerts ?? []).slice(0, 7).map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Link
                        to={`/alerts/${alert.id}`}
                        onClick={() => selectAlert(alert)}
                        className="font-medium text-primary hover:underline"
                      >
                        {alert.rule.description}
                      </Link>
                      <p className="text-xs text-muted-foreground">{alert.id}</p>
                    </TableCell>
                    <TableCell>{alert.agent.name}</TableCell>
                    <TableCell>
                      <SeverityBadge severity={alert.severity} />
                    </TableCell>
                    <TableCell className={riskTone(alert.riskScore)}>{alert.riskScore}</TableCell>
                    <TableCell>{timeAgo(alert.timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Active Incident Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.incidents ?? []).map((incident) => (
              <div key={incident.id} className="rounded-lg border bg-muted/25 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <Link to="/investigations" className="font-medium text-primary hover:underline">
                      {incident.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {incident.id} · {incident.owner} · updated {formatDateTime(incident.updatedAt)}
                    </p>
                  </div>
                  <span className={`rounded-md border px-2 py-0.5 text-xs ${statusTone(incident.status)}`}>
                    {incident.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{incident.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
