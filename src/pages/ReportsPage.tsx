import { Clipboard, Download, FileText, WandSparkles } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSocStore } from "@/store/socStore";

export function ReportsPage() {
  const session = useAuthStore((state) => state.session);
  const report = useSocStore((state) => state.report);
  const loading = useSocStore((state) => state.loading);
  const generateReport = useSocStore((state) => state.generateReport);
  const [copied, setCopied] = useState(false);
  const canGenerate = session ? hasPermission(session.user.role, "reports:generate") : false;

  function exportMarkdown() {
    if (!report) return;
    const blob = new Blob([report.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.id}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyMarkdown() {
    if (!report) return;
    await navigator.clipboard.writeText(report.markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reporting"
        title="Automated SOC Reports"
        description="Generate analyst, executive, and compliance-ready reports from incidents, alerts, ATT&CK coverage, and AI summaries."
        actions={
          <Button
            disabled={!canGenerate || loading || !session}
            onClick={() => session && void generateReport(session.activeTenantId)}
          >
            <WandSparkles className="h-4 w-4" />
            Generate Report
          </Button>
        }
      />

      {report ? (
        <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
          <Card className="bg-card/90 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border bg-muted/25 p-3">
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p className="mt-1 text-sm">{report.period}</p>
                </div>
                <div className="rounded-md border bg-muted/25 p-3">
                  <p className="text-xs text-muted-foreground">Generated</p>
                  <p className="mt-1 text-sm">{formatDateTime(report.generatedAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Executive summary</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.executiveSummary}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Key findings</p>
                <div className="mt-3 space-y-2">
                  {report.keyFindings.map((finding) => (
                    <div key={finding} className="rounded-md border bg-muted/25 p-3 text-sm text-muted-foreground">
                      {finding}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={copyMarkdown}>
                  <Clipboard className="h-4 w-4" />
                  {copied ? "Copied" : "Copy Markdown"}
                </Button>
                <Button variant="outline" onClick={exportMarkdown}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Markdown Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[660px] overflow-auto rounded-lg border bg-background p-4 text-sm leading-6 text-muted-foreground">
                {report.markdown}
              </pre>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-card/90 backdrop-blur-xl">
          <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-3 p-8 text-center">
            <Badge variant="outline">Ready</Badge>
            <p className="text-lg font-medium">No report generated yet</p>
            <p className="max-w-xl text-sm text-muted-foreground">
              Generate a report to compile critical alerts, incident narratives, MITRE coverage, recommended actions,
              and executive-ready observations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
