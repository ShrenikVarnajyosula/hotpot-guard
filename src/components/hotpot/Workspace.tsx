import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  QrCode,
  ScanLine,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PipelineTracker, type StageState } from "./PipelineTracker";
import { ResultPanel } from "./ResultPanel";
import {
  analyzeUrl,
  extractEntities,
  heuristics,
  llmAnalyze,
  localVerdict,
  sanitize,
  vectorSearch,
  type Analysis,
  type ApiConfig,
  type UrlReport,
  type VectorMatch,
} from "@/lib/scam/engine";

const SCENARIOS = [
  {
    chip: "⚡ Electricity Bill Cutoff Scam",
    text: "Dear Customer, your electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not update. Please immediately contact our electricity officer 9832145670 and download BijliUpdate.apk from http://update-bijli.xyz/app.apk to pay Rs. 4,320 to bijli.pay@ybl",
  },
  {
    chip: "💼 Telegram Part-Time Rating Scam",
    text: "Hello! I am Priya from Digital Marketing HR. Part time job available: rate hotels on Google and earn Rs. 5,000 daily. Join our telegram group https://t.me/taskearn99 and complete a prepaid task of Rs. 2,000 to task-rating.app to unlock commission. Payment within 2 hours.",
  },
  {
    chip: "🏦 Bank KYC Account Suspension",
    text: "Dear user, your bank account 4213 5678 9012 3456 will be suspended today as your KYC and PAN card update is pending. Click https://bit.ly/kyc-verify-now and login with netbanking. Share the OTP 483920 received with our executive 9911223344 to complete verification.",
  },
  {
    chip: "📦 Legitimate Courier Delivery",
    text: "Your order #IN82931 has been shipped and is out for delivery today between 10 AM and 6 PM. Track the shipment in the official app. No payment is required at delivery as your order is prepaid. Thank you for shopping with us.",
  },
];

export function Workspace({ config }: { config: ApiConfig }) {
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlReport, setUrlReport] = useState<UrlReport | null>(null);
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  const [stages, setStages] = useState<Record<string, StageState>>({});
  const [running, setRunning] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [sanitized, setSanitized] = useState("");
  const [redactions, setRedactions] = useState<Record<string, number>>({});
  const [matches, setMatches] = useState<VectorMatch[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ---------- OCR ---------- */
  const runOcr = useCallback(async (file: File) => {
    setImagePreview(URL.createObjectURL(file));
    setOcrProgress(0);
    try {
      const { default: Tesseract } = await import("tesseract.js");
      const res = await Tesseract.recognize(file, "eng", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setOcrProgress(Math.round(m.progress * 100));
        },
      });
      const cleaned = res.data.text.replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
      if (!cleaned) toast.error("No readable text found in that image.");
      setText(cleaned);
      setTab("text");
      toast.success("OCR complete — text extracted locally, nothing uploaded.");
    } catch {
      toast.error("OCR engine failed to load.");
    } finally {
      setOcrProgress(null);
    }
  }, []);

  /* ---------- QR ---------- */
  const decodeQrFromCanvas = useCallback(async (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { default: jsQR } = await import("jsqr");
    return jsQR(data.data, data.width, data.height)?.data ?? null;
  }, []);

  const decodeQrFile = useCallback(
    async (file: File) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      const value = await decodeQrFromCanvas(canvas);
      if (value) {
        setQrValue(value);
        setText(value);
        toast.success("QR decoded.");
      } else {
        toast.error("No QR code detected in that image.");
      }
    },
    [decodeQrFromCanvas],
  );

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (!cameraOn) return;
    let raf = 0;
    let cancelled = false;
    const tick = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === 4) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        const value = await decodeQrFromCanvas(canvas);
        if (value && !cancelled) {
          setQrValue(value);
          setText(value);
          toast.success("QR decoded from camera.");
          stopCamera();
          return;
        }
      }
      if (!cancelled) raf = requestAnimationFrame(() => void tick());
    };
    void tick();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [cameraOn, decodeQrFromCanvas, stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      toast.error("Camera access denied. Upload a QR image instead.");
    }
  };

  /* ---------- URL sandbox ---------- */
  const runUrlSandbox = async () => {
    if (!urlInput.trim()) return;
    const report = await analyzeUrl(urlInput);
    setUrlReport(report);
    setText(
      `URL under analysis: ${report.input}\nResolved destination: ${report.finalUrl}\nSandbox findings: ${report.findings.map((f) => f.label).join("; ")}`,
    );
    toast.success("URL sandbox complete.");
  };

  /* ---------- Pipeline ---------- */
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const scan = async () => {
    const raw = text.trim();
    if (!raw) {
      toast.error("Add a message, screenshot, URL or QR code first.");
      return;
    }
    setRunning(true);
    setAnalysis(null);
    setStages({ sanitize: "running" });

    const s = sanitize(raw);
    setSanitized(s.clean);
    setRedactions(s.redactions);
    await wait(320);
    setStages({ sanitize: "done", triage: "running" });

    const h = heuristics(s.clean);
    await wait(280);
    setStages({ sanitize: "done", triage: "done", vector: "running" });

    const m = vectorSearch(s.clean);
    setMatches(m);
    const entities = extractEntities(raw);
    await wait(380);
    setStages({ sanitize: "done", triage: "done", vector: "done", llm: "running" });

    const fallback = localVerdict(s.clean, h, m, entities);
    try {
      const key = config.provider === "groq" ? config.groqKey : config.openaiKey;
      if (!key) throw new Error("no-key");
      const llm = await llmAnalyze(config, s.clean, m, entities, h.hits);
      setAnalysis(llm);
    } catch (err) {
      setAnalysis(fallback);
      const msg = err instanceof Error ? err.message : String(err);
      toast.warning(
        msg === "no-key"
          ? "No API key configured — showing local engine verdict."
          : "LLM call failed — falling back to the local engine.",
      );
    }
    setStages({ sanitize: "done", triage: "done", vector: "done", llm: "done" });
    setRunning(false);
  };

  const redactionCount = Object.values(redactions).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4 text-primary" /> Multi-modal scanner workspace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="text">
                <MessageSquare className="h-4 w-4" /> Text
              </TabsTrigger>
              <TabsTrigger value="ocr">
                <ImageIcon className="h-4 w-4" /> Screenshot
              </TabsTrigger>
              <TabsTrigger value="url">
                <Link2 className="h-4 w-4" /> URL
              </TabsTrigger>
              <TabsTrigger value="qr">
                <QrCode className="h-4 w-4" /> QR
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-4 space-y-3">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the SMS, WhatsApp chat, or email content here…"
                className="min-h-44 font-mono text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {SCENARIOS.map((s) => (
                  <Button key={s.chip} variant="secondary" size="sm" onClick={() => setText(s.text)}>
                    {s.chip}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ocr" className="mt-4 space-y-3">
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) void runOcr(f);
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-10 text-center transition-colors hover:border-primary/50"
              >
                <Upload className="h-6 w-6 text-primary" />
                <p className="text-sm">Drag &amp; drop a screenshot or receipt (PNG / JPG)</p>
                <p className="text-xs text-muted-foreground">Text is extracted in your browser — the image never leaves the device.</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void runOcr(f);
                  }}
                />
              </label>
              {ocrProgress !== null && (
                <div className="space-y-1">
                  <p className="font-mono text-xs text-muted-foreground">Running OCR… {ocrProgress}%</p>
                  <Progress value={ocrProgress} className="h-1.5" />
                </div>
              )}
              {imagePreview && (
                <img src={imagePreview} alt="Uploaded screenshot preview" className="max-h-64 rounded-md border border-border" />
              )}
            </TabsContent>

            <TabsContent value="url" className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://bit.ly/kyc-verify-now"
                  className="min-w-56 flex-1 font-mono"
                />
                <Button onClick={() => void runUrlSandbox()}>Unroll &amp; inspect</Button>
              </div>
              {urlReport && (
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="font-mono text-xs break-all">
                    <span className="text-muted-foreground">destination: </span>
                    {urlReport.finalUrl}
                    {urlReport.unrolled && <Badge className="ml-2">unrolled</Badge>}
                  </p>
                  {urlReport.params.length > 0 && (
                    <div className="font-mono text-xs">
                      <p className="text-muted-foreground">query parameters</p>
                      {urlReport.params.map(([k, v]) => (
                        <p key={k} className="break-all">
                          {k} = {v}
                        </p>
                      ))}
                    </div>
                  )}
                  <ul className="space-y-1 text-sm">
                    {urlReport.findings.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            f.severity === "high" ? "bg-destructive" : f.severity === "med" ? "bg-warning" : "bg-primary"
                          }`}
                        />
                        {f.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="qr" className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {cameraOn ? (
                  <Button variant="destructive" onClick={stopCamera}>
                    Stop camera
                  </Button>
                ) : (
                  <Button onClick={() => void startCamera()}>
                    <Camera className="h-4 w-4" /> Start camera scanner
                  </Button>
                )}
                <label className="inline-flex">
                  <Button asChild variant="outline">
                    <span>
                      <Upload className="h-4 w-4" /> Upload QR image
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void decodeQrFile(f);
                    }}
                  />
                </label>
              </div>
              <div className={cameraOn ? "block" : "hidden"}>
                <video ref={videoRef} playsInline muted className="max-h-72 w-full rounded-md border border-primary/40 object-cover glow-safe" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              {qrValue && (
                <div className="rounded-lg border border-border p-4 font-mono text-xs break-all">
                  <p className="text-muted-foreground">decoded payload</p>
                  <p className="mt-1">{qrValue}</p>
                  {qrValue.startsWith("upi://") && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[...new URLSearchParams(qrValue.split("?")[1] ?? "").entries()].map(([k, v]) => (
                        <Badge key={k} variant="secondary">
                          {k}: {v}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => void scan()} disabled={running} className="font-mono">
              <ScanLine className="h-4 w-4" /> {running ? "Analyzing…" : "Scan & Analyze"}
            </Button>
            {redactionCount > 0 && (
              <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Privacy Shield Active: {redactionCount} PII fields masked
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {(running || analysis) && <PipelineTracker states={stages} />}

      {analysis && <ResultPanel analysis={analysis} sanitized={sanitized} matches={matches} />}
    </div>
  );
}
