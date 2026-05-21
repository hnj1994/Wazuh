import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import type { DashboardMetric } from "@/types";

interface MetricCardProps {
  metric: DashboardMetric;
  icon: LucideIcon;
}

const intentClasses = {
  good: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  warn: "text-amber-300 bg-amber-500/10 border-amber-500/25",
  bad: "text-rose-300 bg-rose-500/10 border-rose-500/25",
  neutral: "text-sky-300 bg-sky-500/10 border-sky-500/25"
};

export function MetricCard({ metric, icon: Icon }: MetricCardProps) {
  const TrendIcon = metric.delta >= 0 ? ArrowUpRight : ArrowDownRight;
  const value = typeof metric.value === "number" ? formatNumber(metric.value) : metric.value;

  return (
    <Card className="bg-card/90 backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-md border", intentClasses[metric.intent])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <TrendIcon className={cn("h-3.5 w-3.5", metric.delta >= 0 ? "text-amber-300" : "text-emerald-300")} />
          <span>{Math.abs(metric.delta)}% vs previous period</span>
        </div>
      </CardContent>
    </Card>
  );
}
