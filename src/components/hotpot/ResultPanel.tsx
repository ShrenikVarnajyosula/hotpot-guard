import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  Fingerprint,
  ListChecks,
  ShieldAlert,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { Analysis, VectorMatch } from "@/lib/scam/engine";

const STYLES = {
  SAFE: { cls: "glow-safe border-primary/40", text: "text-primary", Icon: CheckCircle2, label: "LIKELY SAFE" },
  SUSPICIOUS: { cls: "glow-warn border-warning/40", text: "text-warning", Icon: AlertTriangle, label: "SUSPICIOUS" },
  SCAM: { cls: "glow-danger border-destructive/50", text: "text-destructive", Icon: ShieldAlert, label: "SCAM DETECTED" },
} as const;

export function ResultPanel({
  analysis,
  sanitized,
  matches,
}: {
  analysis: Analysis;
  sanitized: string;
  matches: VectorMatch[];
}) {
  const s = STYLES[analysis.verdict];
  const e = analysis.extracted_entities;

  return (
    <div className="space-y-4">
      <Card className={`bg-card ${s.cls}`}>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-3">
            <s.Icon className={`h-8 w-8 ${s.text}`} />
            <div>
              <CardTitle className={`font-mono text-2xl ${s.text}`}>{s.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{analysis.threat_type}</p>
            </div>
            <div className="ml-auto text-right">
              <p className={`font-mono text-4xl font-bold ${s.text}`}>{analysis.threat_score}</p>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">threat score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={analysis.threat_score} className="h-2" />
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="font-mono">
              Confidence: {analysis.confidence}
            </Badge>
            <Badge variant="outline" className="gap-1 font-mono">
              {analysis.source === "LLM" ? <Bot className="h-3 w-3" /> : <Cpu className="h-3 w-3" />}
              {analysis.source === "LLM" ? "LLM reasoning" : "Local engine"}
            </Badge>
            <Badge variant="outline" className="gap-1 font-mono">
              <Target className="h-3 w-3" /> {analysis.matched_campaign}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{analysis.reasoning}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" /> Red flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.red_flags.length ? (
              <ul className="space-y-2 text-sm">
                {analysis.red_flags.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No red flags detected.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4 text-primary" /> Safety actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {analysis.safety_actions.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fingerprint className="h-4 w-4 text-primary" /> Extracted entities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-xs">
            <EntityRow label="UPI handles" items={e.upi_handles} />
            <EntityRow label="Phone numbers" items={e.phone_numbers} />
            <EntityRow label="Domains" items={e.domains} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Vector memory neighbours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matches.map((m) => (
              <div key={m.campaign.id} className="space-y-1">
                <div className="flex justify-between font-mono text-xs">
                  <span>{m.campaign.name}</span>
                  <span className="text-primary">{m.similarity.toFixed(3)}</span>
                </div>
                <Progress value={m.similarity * 100} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sanitized payload sent to the model</CardTitle>
        </CardHeader>
        <CardContent>
          <Separator className="mb-3" />
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md bg-background p-3 font-mono text-xs text-muted-foreground">
            {sanitized}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function EntityRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {items.length ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {items.map((i, k) => (
            <Badge key={k} variant="secondary" className="font-mono text-[11px]">
              {i}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground/60">none</p>
      )}
    </div>
  );
}
