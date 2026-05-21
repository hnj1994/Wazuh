import { Bot, CalendarClock, CheckCircle2, ClipboardList, UserRound } from "lucide-react";
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

export function IncidentsPage() {
  const session = useAuthStore((state) => state.session);
  const incidents = useSocStore((state) => state.incidents);
  const askAssistant = useSocStore((state) => state.askAssistant);
  const setAssistantOpen = useUiStore((state) => state.setAssistantOpen);

  function generateTimeline(incidentId: string) {
    if (!session) return;
    setAssistantOpen(true);
    void askAssistant(
      `Generate an incident timeline for ${incidentId}. Include evidence, affected assets, MITRE mapping, and containment steps.`,
      session.activeTenantId,
      session.token
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Incident Response"
        title="Investigation Workspace"
        description="Coordinate triage, ownership, evidence timelines, recommended actions, and AI-assisted incident summaries."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_0.42fr]">
        <div className="space-y-4">
          {incidents.map((incident) => (
            <Card key={incident.id} className="bg-card/90 backdrop-blur-xl">
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>{incident.title}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">{incident.summary}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={incident.severity} />
                    <span className={`rounded-md border px-2 py-0.5 text-xs ${statusTone(incident.status)}`}>
                      {incident.status}
                    </span>
                    <Button size="sm" onClick={() => generateTimeline(incident.id)}>
                      <Bot className="h-4 w-4" />
                      Timeline
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Risk</p>
                    <p className={`mt-1 text-2xl font-semibold ${riskTone(incident.riskScore)}`}>{incident.riskScore}</p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="mt-1 flex items-center gap-2 text-sm">
                      <UserRound className="h-4 w-4 text-primary" />
                      {incident.owner}
                    </p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Affected assets</p>
                    <p className="mt-1 text-sm">{incident.affectedAssets.join(", ")}</p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Updated</p>
                    <p className="mt-1 flex items-center gap-2 text-sm">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      {formatDateTime(incident.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
                  <div>
                    <p className="mb-3 text-sm font-medium">AI Incident Timeline</p>
                    <div className="relative space-y-4 pl-5 before:absolute before:left-1.5 before:top-1 before:h-[calc(100%-8px)] before:w-px before:bg-border">
                      {incident.timeline.map((event) => (
                        <div key={event.id} className="relative">
                          <span className="absolute -left-5 top-1.5 h-3 w-3 rounded-full border border-primary bg-background" />
                          <div className="rounded-md border bg-muted/25 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium">{event.title}</p>
                              <SeverityBadge severity={event.severity} />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.timestamp)}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {event.evidence?.map((evidence) => (
                                <Badge key={evidence} variant="outline">
                                  {evidence}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium">Recommended Actions</p>
                    <div className="space-y-2">
                      {incident.recommendedActions.map((action) => (
                        <div key={action} className="flex gap-3 rounded-md border bg-muted/25 p-3 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                          <span className="text-muted-foreground">{action}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <p className="mb-3 text-sm font-medium">Mapped Techniques</p>
                    <div className="flex flex-wrap gap-2">
                      {incident.mitre.map((item) => (
                        <Badge key={`${incident.id}-${item.techniqueId}`} variant="subtle">
                          {item.techniqueId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="h-fit bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Analyst Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Triage new critical alerts", "Contain suspected workstation", "Review RDP exposure", "Publish report notes"].map(
              (task, index) => (
                <div key={task} className="rounded-md border bg-muted/25 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{task}</p>
                    <Badge variant={index === 0 ? "default" : "subtle"}>{index === 0 ? "now" : "queued"}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">SLA target: {index + 1}h</p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
