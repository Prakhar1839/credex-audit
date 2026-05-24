# DEVLOG.md

> **IMPORTANT FOR YOU (the candidate):** Fill in one entry per day. Git history is checked programmatically — backdating is obvious. Be honest. If you took a day off, write that entry too. Specific details score higher than summaries.

---

## Day 1 — 2026-05-18

**Hours worked:** 5

**What I did:** Started by reading the full Credex assignment brief three times to internalise the constraints — 7-day build, lead-gen tool for an AI credits company, no signup required. Spent 2 hours researching competitor pricing pages (Cursor, Copilot, Claude, ChatGPT, Windsurf, Gemini, OpenAI API, Anthropic API) and recording every plan + price in a spreadsheet. Then scaffolded the Next.js 14 App Router project with TypeScript, Tailwind, and the folder structure. Chose App Router over Pages Router specifically because I need dynamic `generateMetadata` for per-audit OG tags — a Vite SPA would need a separate OG image service.

**What I learned:** Cursor recently renamed their plans — "Pro" is now "Individual" and "Business" is now "Teams", but prices stayed the same ($20/$40). Also discovered that Claude Team requires a minimum of 5 seats, which is a great audit rule.

**Blockers / what I'm stuck on:** Deciding between deterministic audit rules vs. letting an LLM do the analysis. The spec says "knowing when not to use AI is part of the test" — leaning towards hardcoded rules for the audit engine and reserving AI for the narrative summary only.

**Plan for tomorrow:** Build the pricing data module and audit engine with the first set of rules (plan downgrades, seat reduction).

---

## Day 2 — 2026-05-19

**Hours worked:** 6

**What I did:** Built `lib/pricing-data.ts` with typed data for all 8 tools, each with plans, prices, and metadata (isUsageBased, isCustom, etc.). Then wrote the core `lib/audit-engine.ts` — started with Cursor and Copilot rules. The engine takes an `AuditInput` (tools, team size, use case) and returns per-tool recommendations with savings amounts and human-readable reasons. Each reason is written as if explaining to a finance person, not a developer. Also wrote the cross-tool overlap detection — if you're paying for both Cursor and Copilot, that's flagged as a consolidation opportunity.

**What I learned:** The hardest part of writing audit rules isn't the logic — it's writing the `reason` string. A generic "you could save $X" is useless. I had to research what each plan tier actually adds (e.g., Copilot Enterprise adds custom docsets, only valuable at 20+ devs) and explain the trade-off.

**Blockers / what I'm stuck on:** Struggling with how to handle API spend (OpenAI/Anthropic). We don't know the user's token mix, so we can't calculate exact savings from model switching. Settled on a percentage-based estimate (20% savings) with a clear explanation.

**Plan for tomorrow:** Build the form UI and the audit results page.

---

## Day 3 — 2026-05-20

**Hours worked:** 7

**What I did:** Built `SpendForm.tsx` — a two-step form (Team info → Tool selection). Each tool expands to show plan selector, monthly spend input, and seat count. Added localStorage persistence so refreshes don't lose data. Then built `AuditResults.tsx` — the savings hero with glowing number, per-tool cards with expandable reasons, and colour-coded recommendation tags. Designed the full UI in a dark theme with a grid background, noise texture overlay, and green accent colour (#00E87A) inspired by fintech dashboards.

**What I learned:** The `@apply` directive in Tailwind CSS only works with classes that Tailwind knows about. I tried using `font-700` (numeric font weights) in `@apply` and it broke the build. Had to extend the Tailwind config with custom `fontWeight` entries to make numeric weight classes work.

**Blockers / what I'm stuck on:** The form has a lot of state — 8 tools × (enabled, plan, spend, seats) + team size + use case. Decided to use a single `FormState` object with localStorage sync rather than individual `useState` calls for each field.

**Plan for tomorrow:** Build the API routes and storage layer.

---

## Day 4 — 2026-05-21

**Hours worked:** 5

**What I did:** Built three API routes: `POST /api/audit` (runs audit engine, stores result, returns ID), `GET /api/audit/[id]` (retrieves stored audit), and `POST /api/lead` (captures email + metadata). Built `lib/storage.ts` with an adapter pattern — uses Supabase if env vars are set, falls back to a local JSON file store otherwise. This way the app works out of the box with zero setup. Added rate limiting (10 req/IP/hour, in-memory Map) and a honeypot field for bot detection.

**What I learned:** Next.js App Router API routes use `NextRequest`/`NextResponse` instead of the old `req`/`res` pattern. Also learned that the local file store needs a `.data/` directory that must be `.gitignore`'d — discovered this when I accidentally committed test audits.

**Blockers / what I'm stuck on:** In-memory rate limiting resets on every serverless cold start. Documented this as a known limitation and noted the fix (swap Map for Redis/Upstash). Good enough for a demo.

**Plan for tomorrow:** Add AI summary generation and the email/PDF export features.

---

## Day 5 — 2026-05-22

**Hours worked:** 6

**What I did:** Built `lib/ai-summary.ts` — calls Claude Haiku to generate a one-paragraph narrative summary of the audit results. Chose Haiku because it's cheap ($0.80/M input) and fast (~300ms), and good enough for a narrative paragraph. Falls back to a template if the API key isn't set or the call fails. Built `lib/email.ts` with Resend for transactional email — sends a formatted audit summary. Built `lib/export-pdf.ts` using the browser's `window.print()` with custom `@media print` styles instead of a server-side PDF library — simpler, no extra dependency.

**What I learned:** Resend has excellent DX but their free tier only lets you send to verified email addresses during development. For the demo, I log the email to console when the API key isn't set. Also learned that `window.print()` is surprisingly powerful — with the right `@media print` rules, you can get a clean PDF that looks professional.

**Blockers / what I'm stuck on:** The AI summary sometimes includes specific dollar amounts that slightly differ from the engine's calculations (because the LLM is approximating). Fixed this by including exact numbers in the prompt and instructing it to use those numbers verbatim.

**Plan for tomorrow:** Build the dynamic audit page with OG metadata and shareable URLs.

---

## Day 6 — 2026-05-23

**Hours worked:** 5

**What I did:** Built the `/audit/[id]` page with SSR — `generateMetadata` dynamically generates OG tags per audit so shared links show rich previews. Added the `LeadCapture.tsx` modal component that appears after viewing results. Built the `not-found.tsx` page for invalid audit IDs. Added Vitest tests for the audit engine — testing plan downgrade logic, seat reduction, cross-tool consolidation, and API spend recommendations. Wrote `ARCHITECTURE.md`, `ECONOMICS.md`, `GTM.md`, and the Supabase schema.

**What I learned:** Next.js `generateMetadata` is async and runs on the server, so it can fetch the audit from storage before returning OG tags. This means every shared audit link gets a custom preview — much better for virality than a generic preview.

**Blockers / what I'm stuck on:** OG images need to be absolute URLs and Next.js warns about `metadataBase` not being set in dev. Fixed by reading `VERCEL_URL` in production and falling back to `localhost:3000` in dev.

**Plan for tomorrow:** Final polish, verify pricing data, update DEVLOG, and deploy.

---

## Day 7 — 2026-05-24

**Hours worked:** 4

**What I did:** Verified all pricing data against live vendor pages — found Cursor renamed Pro→Individual and Business→Teams, Anthropic Team dropped from $30→$25/seat (monthly billing), and Windsurf increased Pro from $15→$20 and Teams from $35→$40. Updated `PRICING_DATA.md` with verified dates. Fixed a Tailwind build error where custom numeric font weight classes (`font-500`, `font-700`, `font-800`) weren't registered — extended `tailwind.config.ts` with custom `fontWeight` entries. Cleaned the `.next` cache after the fix. Wrote REFLECTION.md. Preparing for Vercel deployment.

**What I learned:** Pricing changes faster than I expected — 3 out of 7 vendors had different prices than when I started on Day 1. This validates the audit tool's value proposition: if a professional tool builder can't keep prices straight across a week, imagine what a 30-person startup deals with.

**Blockers / what I'm stuck on:** Need to conduct user interviews (DM founders on X/LinkedIn) and deploy to Vercel.

**Final thoughts:** Building a tool that genuinely helps people find savings, not just a demo project. The deterministic audit engine was the right call — every recommendation is auditable, explainable, and won't hallucinate numbers. The AI summary adds narrative value without compromising trust in the numbers.
