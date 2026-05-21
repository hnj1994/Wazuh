import { Bot, ChevronRight, Loader2, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSocStore } from "@/store/socStore";
import { useUiStore } from "@/store/uiStore";

const suggestions = [
  "Show failed logins in last 24 hours",
  "Explain this alert",
  "Show suspicious PowerShell activity",
  "Generate incident timeline"
];

export function AssistantPanel() {
  const open = useUiStore((state) => state.assistantOpen);
  const setOpen = useUiStore((state) => state.setAssistantOpen);
  const session = useAuthStore((state) => state.session);
  const messages = useSocStore((state) => state.chatMessages);
  const loading = useSocStore((state) => state.assistantLoading);
  const selectedAlert = useSocStore((state) => state.selectedAlert);
  const askAssistant = useSocStore((state) => state.askAssistant);
  const [draft, setDraft] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(content = draft) {
    const value = content.trim();
    if (!value || !session) return;
    setDraft("");
    await askAssistant(value, session.activeTenantId, session.token);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  return (
    <section
      className={cn(
        "fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[440px] flex-col border-l bg-card/95 shadow-panel backdrop-blur-xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}
      aria-label="SOC copilot"
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/15 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">SOC Copilot</p>
            <p className="text-xs text-muted-foreground">Ollama assisted investigation</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close copilot">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {selectedAlert ? (
        <div className="border-b bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Active alert context
          </div>
          <p className="mt-1 truncate text-sm font-medium">{selectedAlert.rule.description}</p>
          <p className="truncate text-xs text-muted-foreground">
            {selectedAlert.id} · {selectedAlert.agent.name} · risk {selectedAlert.riskScore}
          </p>
        </div>
      ) : null}

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[88%] rounded-lg border px-3 py-2 text-sm leading-6",
                message.role === "user"
                  ? "border-primary/30 bg-primary/15 text-foreground"
                  : "border-border bg-muted/40"
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{formatDateTime(message.timestamp)}</p>
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Reasoning over alert context
          </div>
        ) : null}
      </div>

      <div className="border-t p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Button key={suggestion} type="button" variant="outline" size="sm" onClick={() => void submit(suggestion)}>
              {suggestion}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>
        <form ref={formRef} className="space-y-2" onSubmit={onSubmit}>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about alerts, assets, MITRE, hunts, or response steps..."
            className="min-h-24 resize-none bg-background"
          />
          <Button className="w-full" disabled={loading || !draft.trim()}>
            <Send className="h-4 w-4" />
            Ask Copilot
          </Button>
        </form>
      </div>
    </section>
  );
}
