import { useState } from "react";
import { Database, PhoneCall, Settings, ShieldCheck, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Header({
  vectorCount,
  onOpenSettings,
  provider,
  hasKey,
}: {
  vectorCount: number;
  onOpenSettings: () => void;
  provider: string;
  hasKey: boolean;
}) {
  const [sos, setSos] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-primary/40 bg-primary/10 glow-safe">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-mono text-base font-bold tracking-tight">
              The Hotpot <span className="text-muted-foreground">— Scam Prevention AI</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {hasKey ? `LLM online · ${provider}` : "Local engine only · add an API key for XAI reasoning"}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-primary/40 font-mono text-primary">
            <Database className="h-3.5 w-3.5" />
            {vectorCount} vectors indexed
          </Badge>
          <Button variant="outline" size="sm" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" /> API Settings
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setSos(true)}>
            <Siren className="h-4 w-4" /> SOS 1930
          </Button>
        </div>
      </div>

      <Dialog open={sos} onOpenChange={setSos}>
        <DialogContent className="max-w-md border-destructive/40 bg-card glow-danger">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Siren className="h-5 w-5" /> Emergency Cyber Fraud Response
            </DialogTitle>
            <DialogDescription>
              If money has already left your account, act within the golden hour.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-2 text-sm">
            <li>1. Call <span className="font-mono text-destructive">1930</span> — National Cyber Crime Helpline.</li>
            <li>2. File a report at cybercrime.gov.in with screenshots and the UPI/account ID.</li>
            <li>3. Freeze the account and card via your bank&apos;s official helpline.</li>
            <li>4. Uninstall any APK you installed and disconnect the device from the network.</li>
            <li>5. Reset UPI PIN, net-banking and email passwords from a clean device.</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="destructive" className="flex-1">
              <a href="tel:1930">
                <PhoneCall className="h-4 w-4" /> Dial 1930
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">
                Report online
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
