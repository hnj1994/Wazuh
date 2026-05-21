import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, riskTone, statusTone } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSocStore } from "@/store/socStore";
import type { AlertSeverity, AlertStatus } from "@/types";

export function AlertsPage() {
  const session = useAuthStore((state) => state.session);
  const alerts = useSocStore((state) => state.alerts);
  const loading = useSocStore((state) => state.loading);
  const searchAlerts = useSocStore((state) => state.searchAlerts);
  const selectAlert = useSocStore((state) => state.selectAlert);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<AlertSeverity | "all">("all");
  const [status, setStatus] = useState<AlertStatus | "all">("all");
  const [host, setHost] = useState("all");

  const hosts = useMemo(() => Array.from(new Set(alerts.map((alert) => alert.agent.name))).sort(), [alerts]);

  useEffect(() => {
    if (!session) return;
    void searchAlerts({ tenantId: session.activeTenantId }, session.token);
  }, [searchAlerts, session?.activeTenantId, session?.token]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    void searchAlerts(
      {
        tenantId: session.activeTenantId,
        query: query || undefined,
        severities: severity === "all" ? undefined : [severity],
        status: status === "all" ? undefined : [status],
        host: host === "all" ? undefined : host
      },
      session.token
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Alert Triage"
        title="Wazuh Alert Center"
        description="Search, filter, and drill into enriched Wazuh alerts backed by OpenSearch indices and AI summaries."
      />

      <Card className="bg-card/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px_auto]" onSubmit={onSubmit}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search description, host, user, hash, command line..."
              />
            </div>
            <Select value={severity} onChange={(event) => setSeverity(event.target.value as AlertSeverity | "all")}>
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="informational">Informational</option>
            </Select>
            <Select value={status} onChange={(event) => setStatus(event.target.value as AlertStatus | "all")}>
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="triage">Triage</option>
              <option value="investigating">Investigating</option>
              <option value="contained">Contained</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
            <Select value={host} onChange={(event) => setHost(event.target.value)}>
              <option value="all">All hosts</option>
              {hosts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Button disabled={loading}>
              <Filter className="h-4 w-4" />
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card/90 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>User / Source</TableHead>
                <TableHead>MITRE</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="max-w-md">
                    <Link
                      to={`/alerts/${alert.id}`}
                      onClick={() => selectAlert(alert)}
                      className="font-medium text-primary hover:underline"
                    >
                      {alert.rule.description}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.id} · rule {alert.rule.id}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{alert.agent.name}</p>
                    <p className="text-xs text-muted-foreground">{alert.agent.ip}</p>
                  </TableCell>
                  <TableCell>
                    <p>{alert.source.user ?? alert.source.ip ?? "unknown"}</p>
                    <p className="text-xs text-muted-foreground">{alert.source.geo ?? alert.decoder}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {alert.mitre.slice(0, 2).map((item) => (
                        <span key={item.techniqueId} className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs">
                          {item.techniqueId}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={alert.severity} />
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-md border px-2 py-0.5 text-xs ${statusTone(alert.status)}`}>
                      {alert.status}
                    </span>
                  </TableCell>
                  <TableCell className={riskTone(alert.riskScore)}>{alert.riskScore}</TableCell>
                  <TableCell>{formatDateTime(alert.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
