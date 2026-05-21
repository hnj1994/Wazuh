import { CheckCircle2, Circle, Clock, Play, Workflow, XCircle } from "lucide-react";
import { useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSocStore } from "@/store/socStore";
import type { SoarRunStatus } from "@/types";

const statusIcon: Record<SoarRunStatus, typeof Circle> = {
  idle: Circle,
  running: Clock,
  success: CheckCircle2,
  failed: XCircle
};

const statusClass: Record<SoarRunStatus, string> = {
  idle: "text-muted-foreground",
  running: "text-amber-300",
  success: "text-emerald-300",
  failed: "text-rose-300"
};

export function SoarPage() {
  const session = useAuthStore((state) => state.session);
  const playbooks = useSocStore((state) => state.playbooks);
  const loadPlaybooks = useSocStore((state) => state.loadPlaybooks);
  const runPlaybook = useSocStore((state) => state.runPlaybook);
  const canRun = session ? hasPermission(session.user.role, "soar:run") : false;

  useEffect(() => {
    void loadPlaybooks();
  }, [loadPlaybooks]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Automation"
        title="SOAR Workflow Integration"
        description="Simulate response playbooks and wire them to Wazuh active response, ticketing, chat, EDR, firewall, or custom webhooks."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {playbooks.map((playbook) => (
          <Card key={playbook.id} className="bg-card/90 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-primary" />
                    {playbook.name}
                  </CardTitle>
                  <CardDescription className="mt-2">{playbook.description}</CardDescription>
                </div>
                <Badge variant={playbook.enabled ? "default" : "subtle"}>{playbook.enabled ? "enabled" : "disabled"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-muted/25 p-3">
                <p className="text-xs text-muted-foreground">Trigger</p>
                <p className="mt-1 text-sm">{playbook.trigger}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border bg-muted/25 p-3">
                  <p className="text-xs text-muted-foreground">Runs 24h</p>
                  <p className="mt-1 text-xl font-semibold">{playbook.runs24h}</p>
                </div>
                <div className="rounded-md border bg-muted/25 p-3">
                  <p className="text-xs text-muted-foreground">Last run</p>
                  <p className="mt-1 text-sm">{playbook.lastRun ? formatDateTime(playbook.lastRun) : "never"}</p>
                </div>
              </div>
              <div className="space-y-2">
                {playbook.steps.map((step) => {
                  const Icon = statusIcon[step.status];
                  return (
                    <div key={step.id} className="flex items-center justify-between gap-3 rounded-md border bg-muted/25 p-3">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${statusClass[step.status]}`} />
                        <div>
                          <p className="text-sm font-medium">{step.label}</p>
                          <p className="text-xs text-muted-foreground">{step.type}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{step.status}</Badge>
                    </div>
                  );
                })}
              </div>
              <Button
                className="w-full"
                disabled={!playbook.enabled || !canRun}
                onClick={() => void runPlaybook(playbook.id)}
              >
                <Play className="h-4 w-4" />
                Run Playbook
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
