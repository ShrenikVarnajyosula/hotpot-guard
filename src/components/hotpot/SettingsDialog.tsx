import { useEffect, useState } from "react";
import { Database, KeyRound, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiConfig } from "@/lib/scam/engine";

export function SettingsDialog({
  open,
  onOpenChange,
  config,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  config: ApiConfig;
  onSave: (c: ApiConfig) => void;
}) {
  const [draft, setDraft] = useState<ApiConfig>(config);
  useEffect(() => setDraft(config), [config, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            <KeyRound className="h-4 w-4 text-primary" /> Engine Configuration
          </DialogTitle>
          <DialogDescription>
            Keys are stored only in this browser&apos;s localStorage and are sent directly to the provider you choose.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Tabs
            value={draft.provider}
            onValueChange={(v) => setDraft({ ...draft, provider: v as ApiConfig["provider"] })}
          >
            <TabsList className="w-full">
              <TabsTrigger className="flex-1" value="groq">
                Groq · llama-3.3-70b
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="openai">
                OpenAI · gpt-4o-mini
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {draft.provider === "groq" ? (
            <div className="space-y-2">
              <Label htmlFor="groq">Groq API Key</Label>
              <Input
                id="groq"
                type="password"
                placeholder="gsk_..."
                className="font-mono"
                value={draft.groqKey}
                onChange={(e) => setDraft({ ...draft, groqKey: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="oai">OpenAI API Key</Label>
              <Input
                id="oai"
                type="password"
                placeholder="sk-..."
                className="font-mono"
                value={draft.openaiKey}
                onChange={(e) => setDraft({ ...draft, openaiKey: e.target.value })}
              />
            </div>
          )}

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Database className="h-4 w-4 text-primary" /> Client-Side In-Memory Vector Store
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  TF-IDF cosine similarity running fully offline in your browser.
                </p>
              </div>
              <Switch
                checked={draft.useLocalVectors}
                onCheckedChange={(v) => setDraft({ ...draft, useLocalVectors: v })}
              />
            </div>
            {!draft.useLocalVectors && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="chroma">ChromaDB Endpoint URL</Label>
                <Input
                  id="chroma"
                  placeholder="https://chroma.example.com/api/v1"
                  className="font-mono"
                  value={draft.chromaUrl}
                  onChange={(e) => setDraft({ ...draft, chromaUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Falls back to the in-memory store automatically if the endpoint is unreachable.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            <Save className="h-4 w-4" /> Save configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
