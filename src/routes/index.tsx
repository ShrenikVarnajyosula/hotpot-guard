import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Radar, Zap, Brain } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/hotpot/Header";
import { SettingsDialog } from "@/components/hotpot/SettingsDialog";
import { Workspace } from "@/components/hotpot/Workspace";
import { useApiConfig } from "@/lib/scam/config";
import { VECTOR_COUNT } from "@/lib/scam/engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Hotpot — Scam Prevention AI Scanner" },
      {
        name: "description",
        content:
          "Scan SMS, screenshots, links and UPI QR codes for fraud with a private, browser-side scam detection engine backed by vector memory and explainable AI.",
      },
      { property: "og:title", content: "The Hotpot — Scam Prevention AI Scanner" },
      {
        property: "og:description",
        content:
          "Private, in-browser scam detection: PII redaction, heuristic triage, vector campaign matching and explainable LLM verdicts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { Icon: Lock, title: "Privacy Sanitizer", desc: "OTPs, account numbers, phones and balances are masked before anything leaves the browser." },
  { Icon: Zap, title: "Sub-30ms Triage", desc: "Eleven weighted heuristic rules for urgency, coercion and malware delivery." },
  { Icon: Radar, title: "Vector Memory", desc: "TF-IDF cosine search over indexed real-world cybercrime campaigns plus an entity threat graph." },
  { Icon: Brain, title: "Explainable AI", desc: "Groq llama-3.3-70b or GPT-4o-mini returns a strict JSON verdict you can audit." },
];

function Index() {
  const { config, save } = useApiConfig();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasKey = Boolean(config.provider === "groq" ? config.groqKey : config.openaiKey);

  return (
    <div className="min-h-screen">
      <Header
        vectorCount={VECTOR_COUNT}
        onOpenSettings={() => setSettingsOpen(true)}
        provider={config.provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini"}
        hasKey={hasKey}
      />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className="space-y-3">
          <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            Detect the scam <span className="text-primary">before</span> the money moves.
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Paste a message, drop a screenshot, unroll a shortlink or scan a UPI QR. The Hotpot runs a four-stage
            pipeline entirely on your device and only sends redacted text to the reasoning model.
          </p>
        </section>

        <Workspace config={config} />

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-lg border border-border bg-card p-4">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-2 font-mono text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          The Hotpot provides guidance, not legal or financial advice. If you have already lost money, call 1930 or
          report at cybercrime.gov.in immediately.
        </footer>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} config={config} onSave={save} />
      <Toaster position="top-right" />
    </div>
  );
}
