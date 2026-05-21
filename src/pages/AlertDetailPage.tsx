import { ArrowLeft, Bot, Braces, Network, ShieldAlert, TerminalSquare } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTime, riskTone, statusTone } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSocStore } from "@/store/socStore";
import { useUiStore } from "@/store/uiStore";

export function AlertDetailPage() {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const selectedAlert = useSocStore((state) => state.selectedAlert);
  const selectAlertById = useSocStore((state) => state.selectAlertById);
  const askAssistant = useSocStore((state) => state.askAssistant);
  const setAssistantOpen = useUiStore((state) => state.setAssistantOpen);

  useEffect(() => {
    if (alertId) void selectAlertById(alertId);
  }, [alertId, selectAlertById]);

  if (!selectedAlert) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/alerts")}>
          <ArrowLeft className="h-4 w-4" />
          Back to alerts
        </Button>
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">Alert context is loading or unavailable.</CardContent>
        </Card>
      </div>
    );
  }

  const alert = selectedAlert;

  function explain() {
    if (!session) return;
    setAssistantOpen(true);
    void askAssistant("Explain this alert with impact, MITRE mapping, evidence, and next response steps.", session.activeTenantId, session.token);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Alert Drill-down"
        title={alert.rule.description}
        description={`${alert.id} · ${alert.agent.name} · ${formatDateTime(alert.timestamp)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/alerts")}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={explain}>
              <Bot className="h-4 w-4" />
              Explain
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Alert Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Severity</p>
                <div className="mt-2">
                  <SeverityBadge severity={alert.severity} />
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Risk score</p>
                <p className={`mt-2 text-2xl font-semibold ${riskTone(alert.riskScore)}`}>{alert.riskScore}</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <span className={`mt-2 inline-flex rounded-md border px-2 py-0.5 text-xs ${statusTone(alert.status)}`}>
                  {alert.status}
                </span>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Rule level</p>
                <p className="mt-2 text-2xl font-semibold">{alert.rule.level}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">AI incident summary</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {alert.aiSummary ?? "No generated summary is attached yet. Ask the copilot to explain this alert."}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {alert.tags.map((tag) => (
                  <Badge key={tag} variant="subtle">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Evidence</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border bg-muted/30 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <TerminalSquare className="h-4 w-4 text-primary" />
                Endpoint
              </p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Host</dt>
                  <dd>{alert.agent.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">IP</dt>
                  <dd>{alert.agent.ip}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">OS</dt>
                  <dd>{alert.agent.os}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Decoder</dt>
                  <dd>{alert.decoder}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-md border bg-muted/30 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Network className="h-4 w-4 text-primary" />
                Network / Actor
              </p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd>{alert.source.ip ?? alert.source.user ?? "unknown"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Destination</dt>
                  <dd>{alert.destination?.host ?? alert.destination?.ip ?? "n/a"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Port</dt>
                  <dd>{alert.destination?.port ?? alert.source.port ?? "n/a"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Geo</dt>
                  <dd>{alert.source.geo ?? "unknown"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-md border bg-muted/30 p-4 lg:col-span-2">
              <p className="mb-3 text-sm font-medium">Process</p>
              <pre className="overflow-auto rounded-md bg-background p-3 text-xs text-muted-foreground">
                {JSON.stringify(alert.process ?? { message: "No process context in this alert." }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>MITRE ATT&CK Mapping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alert.mitre.map((item) => (
              <div key={`${item.techniqueId}-${item.tactic}`} className="rounded-md border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{item.technique}</p>
                  <Badge variant="outline">{item.techniqueId}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.tactic} · confidence {item.confidence}%
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Braces className="h-4 w-4 text-primary" />
              Raw Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">{alert.fullLog}</div>
            <pre className="max-h-[360px] overflow-auto rounded-md bg-background p-4 text-xs text-muted-foreground">
              {JSON.stringify(alert.raw, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
