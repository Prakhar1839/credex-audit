# ARCHITECTURE.md

## System Diagram

```mermaid
graph TD
    A[User Browser] -->|form submit| B[POST /api/audit]
    B --> C[Audit Engine\nlib/audit-engine.ts]
    C -->|deterministic rules| D[AuditResult]
    D --> E[AI Summary\nlib/ai-summary.ts]
    E -->|claude-haiku-4-5| F[Anthropic API]
    F -->|200 OK or error| E
    E -->|fallback if error| G[Template Summary]
    D --> H[Storage Adapter\nlib/storage.ts]
    H -->|env vars set| I[(Supabase DB)]
    H -->|no env vars| J[.data/audits.json\nlocal fallback]
    B -->|returns audit id| A
    A -->|navigate| K[/audit/id]
    K --> L[GET /api/audit/id]
    L --> H
    L -->|audit data| M[AuditResults Component]
    M -->|email CTA| N[POST /api/lead]
    N --> H
    N --> O[Resend Email API]
```

## Data Flow: Input → Audit Result

1. **User fills form** (`SpendForm.tsx`) — tool selection, plan, monthly spend, seats, team size, use case. State persists in `localStorage` so refreshes don't lose data.

2. **Form submits** to `POST /api/audit`. The request is validated (required fields, honeypot check) and rate-limited (10 req/IP/hour, in-memory).

3. **Audit engine** (`lib/audit-engine.ts`) runs deterministic rule evaluation per tool:
   - Wrong plan for team size → `downgrade_plan`
   - Seat count exceeds team size → `reduce_seats`
   - Overlapping tools → `consolidate`
   - High API spend → `review_api_spend` + savings estimate
   - Credex credits applicable → `credits_available`
   Cross-tool overlap (e.g. Cursor + Copilot) is evaluated after per-tool pass.

4. **AI summary** is generated (`lib/ai-summary.ts`) using `claude-haiku-4-5` — cheap, fast, good enough for a narrative paragraph. Falls back to a template if the API is unavailable.

5. **Audit is persisted** (`lib/storage.ts`) — Supabase if configured, local JSON file otherwise. Returns a nanoid-generated `id`.

6. **User is redirected** to `/audit/{id}`. The page is server-rendered with dynamic OG metadata for rich link previews.

7. **Email capture** — after value is shown, user optionally submits email. The lead is stored separately from the audit (no PII in the public audit record). Confirmation email sent via Resend.

## Stack Rationale

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Next.js 14 App Router | SSR enables dynamic OG tags per audit — critical for the "shareable URL with OG previews" requirement |
| Language | TypeScript | Type safety across audit engine, API routes, and components prevents a class of runtime bugs that are hard to catch in a week |
| Styling | Tailwind CSS | Fast iteration — a 7-day build benefits from colocation of styles and markup |
| DB | Supabase (opt-in) | Free tier, good DX, PostgREST API means no ORM needed |
| Email | Resend | Best deliverability on free tier, good Next.js integration |
| Testing | Vitest | Fast, TypeScript-native, no config overhead vs Jest |
| Deploy | Vercel | Zero-config Next.js deploy, auto-env via VERCEL_URL |

## Scaling to 10,000 Audits/Day

At 10k audits/day, the current architecture breaks in three places:

1. **In-memory rate limiting** resets on each serverless invocation. Fix: replace `ipCounts` Map with Redis (Upstash free tier) keyed by IP, with a 1-hour TTL.

2. **Local file store** doesn't work on Vercel (ephemeral filesystem). Fix: already built — set Supabase env vars and the storage adapter switches automatically.

3. **AI summary** adds ~800ms latency per audit. Fix: move the summary generation to a background job (Supabase Edge Functions or a Vercel Cron) and return the audit immediately, streaming the summary via Server-Sent Events or polling.

Additional: add a CDN cache header on `GET /api/audit/[id]` (audit content doesn't change after creation), and add a `p99` alert on the Anthropic API call latency.
