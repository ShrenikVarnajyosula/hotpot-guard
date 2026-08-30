import { CAMPAIGNS, type Campaign } from "./campaigns";

/* ---------------- Stage 1: PII sanitizer ---------------- */

export interface SanitizeResult {
  clean: string;
  redactions: Record<string, number>;
}

export function sanitize(input: string): SanitizeResult {
  const redactions: Record<string, number> = {};
  const bump = (k: string) => (redactions[k] = (redactions[k] ?? 0) + 1);
  let out = input;

  out = out.replace(/\b(?:\d[ -]?){12,19}\b/g, () => {
    bump("account");
    return "[REDACTED_ACCOUNT]";
  });
  out = out.replace(
    /(?:(?:\+?91|0)[\s-]?)?\b[6-9]\d{9}\b/g,
    () => {
      bump("phone");
      return "[REDACTED_PHONE]";
    },
  );
  out = out.replace(
    /(?:rs\.?|inr|₹)\s?[\d,]+(?:\.\d{1,2})?/gi,
    () => {
      bump("balance");
      return "[REDACTED_BALANCE]";
    },
  );
  out = out.replace(
    /\b(?:otp|code|pin|password)\b[^\d]{0,15}(\d{4,8})/gi,
    () => {
      bump("otp");
      return "OTP [REDACTED_OTP]";
    },
  );
  out = out.replace(/\b\d{4,6}\b(?!\s*(?:pm|am|hrs))/gi, () => {
    bump("otp");
    return "[REDACTED_OTP]";
  });

  return { clean: out, redactions };
}

/* ---------------- Entity extraction ---------------- */

export interface Entities {
  upi_handles: string[];
  phone_numbers: string[];
  domains: string[];
}

const FLAGGED_ENTITIES = [
  "bijli.pay@ybl",
  "update-bijli.xyz",
  "kyc-verify.in",
  "trai-verify.info",
  "fedex-customs.top",
  "task-rating.app",
  "quick-apk.click",
  "sbi-secure.co",
  "paytm-kyc.xyz",
  "bit.ly",
  "tinyurl.com",
  "cutt.ly",
  "t.me",
];

const SHORTENERS = ["bit.ly", "tinyurl.com", "cutt.ly", "t.co", "goo.gl", "is.gd", "rb.gy", "shorturl.at", "ow.ly"];

const TRUSTED_BRANDS = ["sbi", "paytm", "hdfc", "icici", "amazon", "flipkart", "google", "fedex", "dhl", "netflix", "phonepe"];

export function extractEntities(raw: string): Entities {
  const upi = [...raw.matchAll(/\b[\w.\-]{2,}@(?:ybl|okaxis|paytm|upi|oksbi|okhdfcbank|ibl|apl|axl)\b/gi)].map((m) => m[0]);
  const phones = [...raw.matchAll(/(?:\+?91[\s-]?)?\b[6-9]\d{9}\b/g)].map(() => "[REDACTED_PHONE]");
  const domains = [
    ...raw.matchAll(/\b(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})(?:\/[^\s]*)?/gi),
  ]
    .map((m) => m[0])
    .filter((d) => !d.includes("@"));
  return {
    upi_handles: [...new Set(upi)],
    phone_numbers: [...new Set(phones)],
    domains: [...new Set(domains)],
  };
}

export function graphMatches(entities: Entities): string[] {
  const hay = [...entities.upi_handles, ...entities.domains].map((s) => s.toLowerCase());
  return FLAGGED_ENTITIES.filter((f) => hay.some((h) => h.includes(f)));
}

/* ---------------- Stage 2: heuristics ---------------- */

export interface Heuristic {
  label: string;
  weight: number;
  hit: boolean;
}

const RULES: { label: string; weight: number; re: RegExp }[] = [
  { label: "Artificial urgency / deadline pressure", weight: 18, re: /(within \d+\s*(hours?|minutes?)|tonight|immediately|urgent|last date|before \d{1,2}[:.]?\d{0,2}\s*(am|pm)|expire|24 hours|today itself)/i },
  { label: "Unverified APK / app installation request", weight: 26, re: /(\.apk|install (the )?app|download (the )?app|allow permissions|anydesk|teamviewer|quick ?support|screen shar)/i },
  { label: "OTP / PIN / credential harvesting", weight: 24, re: /(share (the )?otp|enter (your )?(upi )?pin|cvv|netbanking (login|password)|send (the )?code|verification code)/i },
  { label: "Account suspension / disconnection threat", weight: 16, re: /(suspend|block(ed)?|deactivat|disconnect|terminat|freeze|cut off|power (will be )?cut)/i },
  { label: "KYC / document re-verification demand", weight: 14, re: /(kyc|pan card|aadhaar|re-?verify|update your (details|documents))/i },
  { label: "Payment coercion / fee to release funds", weight: 20, re: /(pay (a )?(small )?(fee|charge|tax|gst|clearance)|processing fee|refundable deposit|transfer .{0,20}(to|via) upi|scan (the )?qr|collect request)/i },
  { label: "Prize / guaranteed high return bait", weight: 18, re: /(you (have )?won|lottery|lucky draw|guaranteed (returns?|profit)|double your money|earn \d+ ?(k|thousand|lakh)? ?(daily|per day))/i },
  { label: "Shortened or suspicious link", weight: 15, re: /(bit\.ly|tinyurl|cutt\.ly|t\.me|rb\.gy|is\.gd|shorturl|goo\.gl|\.xyz|\.top|\.click|\.info\/)/i },
  { label: "Contact routed to personal mobile number", weight: 14, re: /(call|contact|whatsapp)[^.]{0,30}(\+?91[\s-]?)?[6-9]\d{9}/i },
  { label: "Authority / law-enforcement impersonation", weight: 22, re: /(cbi|police|trai|income tax|customs|rbi|court|digital arrest|fir|narcotics)/i },
  { label: "Grammar & formatting anomalies", weight: 6, re: /(dear customer,? your|kindly do the needful|sir\/madam|!{2,}|[A-Z]{8,})/ },
];

export function heuristics(text: string): { hits: Heuristic[]; score: number } {
  const hits = RULES.map((r) => ({ label: r.label, weight: r.weight, hit: r.re.test(text) }));
  const score = Math.min(100, hits.filter((h) => h.hit).reduce((a, b) => a + b.weight, 0));
  return { hits, score };
}

/* ---------------- Stage 3: TF-IDF vector memory ---------------- */

const STOP = new Set("a an the is are was were be to of and or in on for your you my we it this that will with at as by from not no if".split(" "));

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9@. ]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function tf(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  tokens.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1));
  return m;
}

const DF = new Map<string, number>();
const N = CAMPAIGNS.length;
for (const c of CAMPAIGNS) {
  for (const t of new Set(tokenize(c.text))) DF.set(t, (DF.get(t) ?? 0) + 1);
}

function vector(text: string): Map<string, number> {
  const counts = tf(tokenize(text));
  const v = new Map<string, number>();
  let norm = 0;
  counts.forEach((count, term) => {
    const idf = Math.log((N + 1) / ((DF.get(term) ?? 0) + 1)) + 1;
    const w = (1 + Math.log(count)) * idf;
    v.set(term, w);
    norm += w * w;
  });
  norm = Math.sqrt(norm) || 1;
  v.forEach((w, t) => v.set(t, w / norm));
  return v;
}

const INDEX = CAMPAIGNS.map((c) => ({ campaign: c, vec: vector(c.text) }));

export const VECTOR_COUNT = INDEX.length;

export interface VectorMatch {
  campaign: Campaign;
  similarity: number;
}

export function vectorSearch(text: string, k = 3): VectorMatch[] {
  const q = vector(text);
  return INDEX.map(({ campaign, vec }) => {
    let dot = 0;
    q.forEach((w, t) => {
      const o = vec.get(t);
      if (o) dot += w * o;
    });
    return { campaign, similarity: dot };
  })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

/* ---------------- URL sandbox ---------------- */

export interface UrlReport {
  input: string;
  finalUrl: string;
  unrolled: boolean;
  host: string;
  params: [string, string][];
  findings: { label: string; severity: "low" | "med" | "high" }[];
}

function homoglyphSuspect(host: string): boolean {
  return /[^\x00-\x7F]/.test(host) || /xn--/.test(host) || /(rn|vv|1l|0o)/i.test(host);
}

function levenshtein(a: string, b: string): number {
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    prev = cur;
  }
  return prev[b.length] ?? 0;
}

export async function analyzeUrl(raw: string): Promise<UrlReport> {
  let input = raw.trim();
  if (!/^https?:\/\//i.test(input)) input = "http://" + input;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { input: raw, finalUrl: raw, unrolled: false, host: raw, params: [], findings: [{ label: "Malformed URL", severity: "high" }] };
  }
  const findings: UrlReport["findings"] = [];
  let finalUrl = url.toString();
  let unrolled = false;

  if (SHORTENERS.some((s) => url.hostname.endsWith(s))) {
    findings.push({ label: `Shortened link (${url.hostname}) hides the true destination`, severity: "high" });
    try {
      const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url.toString())}`, { redirect: "follow" });
      if (r.url && !r.url.includes("allorigins")) {
        finalUrl = r.url;
        unrolled = true;
      }
    } catch {
      findings.push({ label: "Unroll attempt blocked — destination unverified", severity: "med" });
    }
  }

  const host = new URL(finalUrl).hostname.replace(/^www\./, "");
  const tld = "." + host.split(".").slice(-1)[0];
  if ([".xyz", ".top", ".click", ".zip", ".rest", ".cfd", ".icu", ".buzz"].includes(tld))
    findings.push({ label: `High-abuse TLD ${tld} — typical of freshly registered scam domains`, severity: "high" });
  if (homoglyphSuspect(host)) findings.push({ label: "Homoglyph / punycode characters detected in hostname", severity: "high" });
  const label = host.split(".")[0] ?? host;
  for (const brand of TRUSTED_BRANDS) {
    const d = levenshtein(label.toLowerCase(), brand);
    if (d > 0 && d <= 2) findings.push({ label: `Typosquatting "${brand}" (edit distance ${d})`, severity: "high" });
    else if (label.toLowerCase().includes(brand) && !host.endsWith(`${brand}.com`) && !host.endsWith(`${brand}.in`))
      findings.push({ label: `Brand "${brand}" used in an unofficial domain`, severity: "med" });
  }
  if (/\.(apk|exe|scr|zip)(\?|$)/i.test(finalUrl)) findings.push({ label: "Direct executable/APK download link", severity: "high" });
  if (url.protocol === "http:") findings.push({ label: "No HTTPS — traffic is unencrypted", severity: "med" });
  if (/\d+\.\d+\.\d+\.\d+/.test(host)) findings.push({ label: "Raw IP address instead of a domain name", severity: "high" });
  if (host.split(".").length > 3) findings.push({ label: "Deep subdomain nesting used to mimic a brand path", severity: "med" });
  if (FLAGGED_ENTITIES.some((f) => host.includes(f))) findings.push({ label: "Domain present in flagged threat-graph index", severity: "high" });
  if (!findings.length) findings.push({ label: "No structural red flags found in URL", severity: "low" });

  return { input: raw, finalUrl, unrolled, host, params: [...new URL(finalUrl).searchParams.entries()], findings };
}

/* ---------------- Verdict schema ---------------- */

export interface Analysis {
  verdict: "SAFE" | "SUSPICIOUS" | "SCAM";
  threat_score: number;
  threat_type: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  red_flags: string[];
  reasoning: string;
  matched_campaign: string;
  safety_actions: string[];
  extracted_entities: Entities;
  source: "LLM" | "LOCAL";
}

export function localVerdict(
  sanitized: string,
  h: { hits: Heuristic[]; score: number },
  matches: VectorMatch[],
  entities: Entities,
): Analysis {
  const top = matches[0] ?? { campaign: CAMPAIGNS[0]!, similarity: 0 };
  const graph = graphMatches(entities);
  const blended = Math.min(
    100,
    Math.round(h.score * 0.6 + top.similarity * 100 * 0.4 + graph.length * 8 + (top.campaign.id === "SAFE-000" ? -25 : 0)),
  );
  const verdict = blended >= 65 ? "SCAM" : blended >= 35 ? "SUSPICIOUS" : "SAFE";
  return {
    verdict,
    threat_score: Math.max(0, blended),
    threat_type: verdict === "SAFE" ? "No known scam pattern" : top.campaign.category,
    confidence: top.similarity > 0.35 || h.score > 55 ? "HIGH" : h.score > 25 ? "MEDIUM" : "LOW",
    red_flags: [
      ...h.hits.filter((x) => x.hit).map((x) => x.label),
      ...graph.map((g) => `Flagged entity in threat graph: ${g}`),
    ],
    reasoning:
      verdict === "SAFE"
        ? "Local heuristics and vector memory found no significant overlap with indexed scam campaigns, and no coercive or credential-harvesting language was present."
        : `Local analysis matched indexed campaign "${top.campaign.name}" at cosine similarity ${top.similarity.toFixed(2)} and triggered ${h.hits.filter((x) => x.hit).length} heuristic rules covering urgency, coercion or malware delivery.`,
    matched_campaign: `${top.campaign.name} (Vector Similarity: ${top.similarity.toFixed(2)})`,
    safety_actions:
      verdict === "SAFE"
        ? ["Still verify sender identity through official channels.", "Never share OTPs even with apparent support staff."]
        : [
            "Do not click any link or install any downloaded file.",
            "Verify the claim directly on the organisation's official portal or app.",
            "Report the number/UPI ID to 1930 or cybercrime.gov.in.",
          ],
    extracted_entities: entities,
    source: "LOCAL",
  };
}

/* ---------------- Stage 4: LLM ---------------- */

export interface ApiConfig {
  provider: "groq" | "openai";
  groqKey: string;
  openaiKey: string;
  chromaUrl: string;
  useLocalVectors: boolean;
}

const SCHEMA_PROMPT = `You are a cyber-fraud analyst. Respond with ONLY valid minified JSON matching:
{"verdict":"SAFE"|"SUSPICIOUS"|"SCAM","threat_score":0-100,"threat_type":string,"confidence":"LOW"|"MEDIUM"|"HIGH","red_flags":[string],"reasoning":string,"matched_campaign":string,"safety_actions":[string],"extracted_entities":{"upi_handles":[string],"phone_numbers":[string],"domains":[string]}}
No markdown, no commentary.`;

export async function llmAnalyze(
  cfg: ApiConfig,
  sanitized: string,
  matches: VectorMatch[],
  entities: Entities,
  heur: Heuristic[],
): Promise<Analysis> {
  const key = cfg.provider === "groq" ? cfg.groqKey : cfg.openaiKey;
  if (!key) throw new Error("no-key");
  const url =
    cfg.provider === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
  const model = cfg.provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

  const context = matches
    .map((m) => `- ${m.campaign.name} [${m.campaign.category}] similarity=${m.similarity.toFixed(2)}`)
    .join("\n");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SCHEMA_PROMPT },
        {
          role: "user",
          content: `SANITIZED MESSAGE (PII already masked):\n${sanitized}\n\nVECTOR MEMORY MATCHES:\n${context}\n\nHEURISTIC HITS:\n${heur.filter((h) => h.hit).map((h) => "- " + h.label).join("\n") || "none"}\n\nEXTRACTED ENTITIES:\n${JSON.stringify(entities)}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(content.replace(/^```json|```$/g, "").trim());
  return {
    verdict: parsed.verdict ?? "SUSPICIOUS",
    threat_score: Number(parsed.threat_score) || 0,
    threat_type: parsed.threat_type ?? "Unknown",
    confidence: parsed.confidence ?? "MEDIUM",
    red_flags: parsed.red_flags ?? [],
    reasoning: parsed.reasoning ?? "",
    matched_campaign: parsed.matched_campaign ?? `${matches[0]?.campaign.name ?? "n/a"} (Vector Similarity: ${(matches[0]?.similarity ?? 0).toFixed(2)})`,
    safety_actions: parsed.safety_actions ?? [],
    extracted_entities: { ...entities, ...(parsed.extracted_entities ?? {}) },
    source: "LLM",
  };
}
