import { Crosshair, ShieldCheck } from "lucide-react";
import { useEffect, useMemo } from "react";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDateTime } from "@/lib/utils";
import { useSocStore } from "@/store/socStore";

export function MitrePage() {
  const mitre = useSocStore((state) => state.mitre);
  const loadMitre = useSocStore((state) => state.loadMitre);

  useEffect(() => {
    void loadMitre();
  }, [loadMitre]);

  const grouped = useMemo(() => {
    return mitre.reduce<Record<string, typeof mitre>>((acc, technique) => {
      acc[technique.tactic] = [...(acc[technique.tactic] ?? []), technique];
      return acc;
    }, {});
  }, [mitre]);

  const averageCoverage = mitre.length
    ? Math.round(mitre.reduce((sum, technique) => sum + technique.coverage, 0) / mitre.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detection Engineering"
        title="MITRE ATT&CK Coverage"
        description="Map Wazuh detections, OpenSearch analytics, and AI-enriched incidents to ATT&CK tactics and techniques."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Average coverage</p>
            <p className="mt-2 text-3xl font-semibold">{averageCoverage}%</p>
            <Progress className="mt-4" value={averageCoverage} />
          </CardContent>
        </Card>
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Mapped techniques</p>
            <p className="mt-2 text-3xl font-semibold">{mitre.length}</p>
            <p className="mt-3 text-sm text-muted-foreground">Across {Object.keys(grouped).length} tactics</p>
          </CardContent>
        </Card>
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Detection hits</p>
            <p className="mt-2 text-3xl font-semibold">
              {mitre.reduce((sum, technique) => sum + technique.detections, 0)}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">From current alert and hunt telemetry</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {Object.entries(grouped).map(([tactic, techniques]) => (
          <Card key={tactic} className="bg-card/90 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary" />
                {tactic}
                <Badge variant="outline">{techniques[0]?.tacticId}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {techniques.map((technique) => (
                  <div key={technique.techniqueId} className="rounded-lg border bg-muted/25 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{technique.technique}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{technique.techniqueId}</p>
                      </div>
                      <SeverityBadge severity={technique.severity} />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Coverage</span>
                        <span>{technique.coverage}%</span>
                      </div>
                      <Progress value={technique.coverage} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        {technique.detections} detections
                      </span>
                      <span>{formatDateTime(technique.lastSeen)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
