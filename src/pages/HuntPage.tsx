import { Play, SearchCode, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { translateNaturalLanguage } from "@/lib/queryLanguage";
import { formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSocStore } from "@/store/socStore";

export function HuntPage() {
  const session = useAuthStore((state) => state.session);
  const huntQueries = useSocStore((state) => state.huntQueries);
  const huntResults = useSocStore((state) => state.huntResults);
  const loading = useSocStore((state) => state.loading);
  const loadHuntQueries = useSocStore((state) => state.loadHuntQueries);
  const runHunt = useSocStore((state) => state.runHunt);
  const [query, setQuery] = useState("Show suspicious PowerShell activity");
  const [language, setLanguage] = useState("natural");

  const translated = useMemo(() => translateNaturalLanguage(query), [query]);

  useEffect(() => {
    void loadHuntQueries();
  }, [loadHuntQueries]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    void runHunt(query, session.activeTenantId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Threat Hunting"
        title="Natural Language Hunt Workspace"
        description="Ask analyst questions, translate them into OpenSearch/Lucene DSL, and review Wazuh-backed evidence."
      />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchCode className="h-4 w-4 text-primary" />
              Hunt Query
            </CardTitle>
            <CardDescription>Use natural language, Lucene, KQL-style text, or JSON DSL.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <Textarea
                  className="min-h-40 resize-y font-mono"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <div className="space-y-3">
                  <Select value={language} onChange={(event) => setLanguage(event.target.value)}>
                    <option value="natural">Natural language</option>
                    <option value="lucene">Lucene</option>
                    <option value="kuery">KQL</option>
                    <option value="dsl">OpenSearch DSL</option>
                  </Select>
                  <Button className="w-full" disabled={loading}>
                    <Play className="h-4 w-4" />
                    Run Hunt
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                AI translation preview
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{translated.explanation}</p>
              <pre className="mt-3 overflow-auto rounded-md bg-background p-3 text-xs text-muted-foreground">
                {translated.query}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Saved Hunts</CardTitle>
            <CardDescription>Reusable detections for repeatable analyst workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {huntQueries.map((hunt) => (
              <button
                key={hunt.id}
                className="w-full rounded-lg border bg-muted/25 p-4 text-left transition-colors hover:bg-muted/50"
                onClick={() => {
                  setQuery(hunt.query);
                  setLanguage(hunt.language);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{hunt.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{hunt.description}</p>
                  </div>
                  <Badge variant="outline">{hunt.language}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hunt.tags.map((tag) => (
                    <Badge key={tag} variant="subtle">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Hunt Results</CardTitle>
          <CardDescription>Evidence preview from Wazuh alert, Sysmon, auditd, and network telemetry.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>MITRE</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {huntResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{formatDateTime(result.timestamp)}</TableCell>
                  <TableCell className="font-medium">{result.host}</TableCell>
                  <TableCell>{result.user ?? "unknown"}</TableCell>
                  <TableCell>{result.eventType}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={result.severity} />
                  </TableCell>
                  <TableCell>{result.mitre ?? "n/a"}</TableCell>
                  <TableCell className="max-w-xl text-muted-foreground">{result.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!huntResults.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Run a hunt to populate results.</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
