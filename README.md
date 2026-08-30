# Hotpot Shield

You are a Principal Full-Stack AI & Cybersecurity Engineer. Build a complete, production-ready scam detection web application named "The Hotpot" in one go. The app must execute entirely in the browser using client-side vector memory (ChromaDB-compatible / TF-IDF Vector cosine similarity fallback) and live LLM reasoning via user-provided API keys.

---

### 1. APPLICATION LAYOUT & API CONFIGURATION
- **Theme:** Cybersecurity dark mode (Background: Slate `#0B0F19`, Card: `#111827`, Borders: `#1F2937`, Accents: Emerald `#10B981`, Amber `#F59E0B`, Crimson `#EF4444`).
- **Persistent Header:**
  - Logo with Shield icon: **"The Hotpot - Scam Prevention AI"**
  - Live Vector Memory Badge: Displays total indexed scam vectors (dynamic counter).
  - Emergency SOS Button: Links/dials `1930` (National Cyber Crime Helpline) and opens a quick response modal.
  - **API Settings Modal / Drawer:**
    - Input for **Groq API Key** (using `llama-3.3-70b-versatile`) or **OpenAI API Key** (`gpt-4o-mini`).
    - Input for custom **ChromaDB Endpoint URL** (with toggle for "Client-Side In-Memory Vector Store").
    - Securely persist keys in `localStorage`.

---

### 2. MULTI-MODAL SCANNER WORKSPACE (4 INPUT TABS)
1. **Text & Message Tab:**
   - Multi-line textarea for SMS, WhatsApp chats, or emails.
   - 4 Pre-loaded Test Scenario Chips:
     - "⚡ Electricity Bill Cutoff Scam"
     - "💼 Telegram Part-Time Rating Scam"
     - "🏦 Bank KYC Account Suspension"
     - "📦 Legitimate Courier Delivery"
2. **Screenshot & Receipt OCR Tab:**
   - Drag-and-drop image uploader (PNG, JPG).
   - Embedded Tesseract.js / Canvas OCR parser that extracts text client-side, runs regex sanitization, and sends it directly to the analysis pipeline.
3. **URL & Shortlink Sandbox Tab:**
   - Unrolls shortened links (e.g., bit.ly, tinyurl), parses query parameters, inspects domain age, and tests for typosquatting / homoglyphs.
4. **Live QR Code Scanner Tab:**
   - Camera viewfinder or image upload to decode QR codes, extracting UPI payment URIs (`upi://pay?pa=...`) or deep-links for immediate threat scoring.

---

### 3. COMPLETE 4-STAGE DETECTION ENGINE & CHROMADB PIPELINE
When "Scan & Analyze" is clicked, run this pipeline with an animated step-by-step progress tracker:

#### Stage 1: Client-Side Privacy Sanitizer (PII Redaction)
- Execute local regex to replace sensitive info BEFORE any API call:
  - OTPs / 4-6 digit codes: `[REDACTED_OTP]`
  - Bank Accounts / Cards: `[REDACTED_ACCOUNT]`
  - Phone Numbers: `[REDACTED_PHONE]`
  - Account Balances: `[REDACTED_BALANCE]`
- Display a badge: *"🔒 Privacy Shield Active: PII Masked"*.

#### Stage 2: Tier 1 Fast Triage (Heuristics Engine)
- Sub-30ms scoring across regex patterns: urgency triggers ("within 2 hours", "tonight 9:30 PM"), unauthorized APK downloads, and payment coercion.

#### Stage 3: Tier 2 ChromaDB / Vector Memory & Threat Graph Search
- Maintain a local vector database initialized with 10+ real-world cybercrime campaigns (e.g., Electricity Disconnection syndicates, TRAI parcel impersonation, FedEx customs fraud, APK remote access Trojans).
- Compute cosine similarity between the incoming sanitized text and indexed campaign vectors.
- Extract UPI handles, phone numbers, and domains; check them against a local graph index of flagged malicious entities.

#### Stage 4: Tier 3 Explainable AI Reasoning (Constrained LLM)
- Call Groq or OpenAI with the sanitized text + matched ChromaDB vector context + extracted entities.
- Force valid JSON response matching this schema:
```json
{
  "verdict": "SAFE" | "SUSPICIOUS" | "SCAM",
  "threat_score": 88,
  "threat_type": "Fake Utility Disconnection / APK Trojan Fraud",
  "confidence": "HIGH",
  "red_flags": [
    "Artificial urgency claiming power will be cut tonight",
    "Directs user to contact a personal 10-digit phone number",
    "Instructs download of an unverified remote-access APK"
  ],
  "reasoning": "The message impersonates a state electricity board but routes the victim to a personal contact number and an untrusted APK download to gain unauthorized device access.",
  "matched_campaign": "National Power Syndicate #402 (Vector Similarity: 0.89)",
  "safety_actions": [
    "Do not click the link or install the downloaded file.",
    "Verify bill status directly on the official power portal.",
    "Report the number to 1930 / cybercrime.gov.in."
  ],
  "extracted_entities": {
    "upi_handles": ["bijli.pay@ybl"],
    "phone_numbers": ["[REDACTED_PHONE]"],
    "domains": ["[http://update-bijli.xyz/app.apk](http://update-bijli.xyz/app.apk)"]
  }
}
make sure you finish this project within the credit limit, complete it fully before credits run out

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0f64924c-d317-4c19-84ee-8bffc243cd2b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
