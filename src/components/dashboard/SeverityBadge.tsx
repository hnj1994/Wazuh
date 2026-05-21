import { Badge } from "@/components/ui/badge";
import { severityTone } from "@/lib/utils";
import type { AlertSeverity } from "@/types";

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <Badge className={severityTone(severity)}>{severity}</Badge>;
}
