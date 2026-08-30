import { Check, Loader2, Lock, Radar, Zap, Brain } from "lucide-react";

export type StageState = "idle" | "running" | "done";

const STAGES = [
  { key: "sanitize", label: "Privacy Sanitizer", desc: "Local PII redaction", Icon: Lock },
  { key: "triage", label: "Tier 1 Fast Triage", desc: "Heuristic regex scoring", Icon: Zap },
  { key: "vector", label: "Tier 2 Vector Memory", desc: "Cosine similarity + threat graph", Icon: Radar },
  { key: "llm", label: "Tier 3 Explainable AI", desc: "Constrained JSON reasoning", Icon: Brain },
] as const;

export function PipelineTracker({ states }: { states: Record<string, StageState> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {STAGES.map(({ key, label, desc, Icon }) => {
        const st = states[key] ?? "idle";
        return (
          <div
            key={key}
            className={`rounded-lg border p-3 transition-all ${
              st === "done"
                ? "border-primary/40 bg-primary/5"
                : st === "running"
                  ? "border-warning/50 bg-warning/5 hotpot-sweep scanline"
                  : "border-border bg-card/60 opacity-60"
            }`}
          >
            <div className="flex items-center gap-2">
              {st === "running" ? (
                <Loader2 className="h-4 w-4 animate-spin text-warning" />
              ) : st === "done" ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Icon className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-mono text-xs font-semibold">{label}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{desc}</p>
          </div>
        );
      })}
    </div>
  );
}
