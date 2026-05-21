import { Radar, Search, ShieldQuestion } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { useSocStore } from "@/store/socStore";

function reputationClass(reputation: string) {
  const classes: Record<string, string> = {
    malicious: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    suspicious: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    clean: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    unknown: "border-slate-500/30 bg-slate-500/10 text-slate-300"
  };
  return classes[reputation] ?? classes.unknown;
}

export function ThreatIntelPage() {
  const threatIntel = useSocStore((state) => state.threatIntel);
  const loadThreatIntel = useSocStore((state) => state.loadThreatIntel);
  const enrichIndicator = useSocStore((state) => state.enrichIndicator);
  const [indicator, setIndicator] = useState("185.244.25.18");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadThreatIntel();
  }, [loadThreatIntel]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!indicator.trim()) return;
    setLoading(true);
    await enrichIndicator(indicator.trim());
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Threat Intelligence"
        title="IOC Enrichment"
        description="Enrich IPs, domains, URLs, hashes, and identities from local cache, MISP, OTX, AbuseIPDB, VirusTotal, or your own feeds."
      />

      <Card className="bg-card/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldQuestion className="h-4 w-4 text-primary" />
            Enrich Indicator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={onSubmit}>
            <Input value={indicator} onChange={(event) => setIndicator(event.target.value)} placeholder="IP, domain, hash, URL..." />
            <Button disabled={loading}>
              <Search className="h-4 w-4" />
              Enrich
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            Enrichment Cache
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicator</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reputation</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {threatIntel.map((item) => (
                <TableRow key={item.value}>
                  <TableCell className="font-mono text-sm">{item.value}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    <span className={`rounded-md border px-2 py-0.5 text-xs ${reputationClass(item.reputation)}`}>
                      {item.reputation}
                    </span>
                  </TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={item.confidence} />
                      <span className="w-9 text-xs text-muted-foreground">{item.confidence}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.sources.join(", ")}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge key={`${item.value}-${tag}`} variant="subtle">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(item.lastSeen)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
