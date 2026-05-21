import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { severityTone, timeAgo } from "@/lib/utils";
import { useSocStore } from "@/store/socStore";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const alerts = useSocStore((state) => state.alerts);
  const selectAlert = useSocStore((state) => state.selectAlert);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];
    return alerts
      .filter((alert) =>
        [alert.id, alert.rule.description, alert.agent.name, alert.fullLog, ...alert.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalized)
      )
      .slice(0, 6);
  }, [alerts, query]);

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        className="h-9 bg-muted/40 pl-9"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search alerts, hosts, users, MITRE..."
      />
      {results.length ? (
        <div className="absolute left-0 right-0 top-11 z-40 overflow-hidden rounded-lg border bg-popover shadow-panel">
          {results.map((alert) => (
            <button
              key={alert.id}
              className="flex w-full items-start gap-3 border-b px-3 py-3 text-left last:border-0 hover:bg-muted/50"
              onClick={() => {
                selectAlert(alert);
                setQuery("");
                navigate(`/alerts/${alert.id}`);
              }}
            >
              <span className={`mt-0.5 rounded-md border px-2 py-0.5 text-xs ${severityTone(alert.severity)}`}>
                {alert.severity}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{alert.rule.description}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {alert.agent.name} · {alert.id} · {timeAgo(alert.timestamp)}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
