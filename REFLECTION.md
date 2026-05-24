# REFLECTION.md

> **IMPORTANT FOR YOU:** Answer all 5 questions with 150–400 words each. Be specific. Generic answers score poorly. These are read carefully by humans.

---

## 1. The hardest bug you hit this week, and how you debugged it

*Be specific — what hypotheses did you form, what did you try, what worked?*

The most frustrating bug was a Tailwind CSS build crash that only appeared when the dev server compiled — the error said `The 'font-700' class does not exist. If 'font-700' is a custom class, make sure it is defined within a @layer directive.` It came from `globals.css` where I had utility classes like `.btn-primary` using `@apply font-700`. The confusing part was that `font-700` worked fine in JSX `className` strings (Tailwind just ignored unknown classes silently in markup), but `@apply` is stricter and validates against the Tailwind class registry.

My first hypothesis was that I needed to use `font-bold` instead of `font-700`. That's correct for standard Tailwind, but the codebase uses numeric weights consistently across 17+ locations — `font-500`, `font-600`, `font-700`, `font-800` — and changing all of them to semantic names (`font-medium`, `font-semibold`, `font-bold`, `font-extrabold`) would lose the intentional precision. My second hypothesis was to define them in a `@layer` directive, but that felt like fighting the framework.

The fix that actually worked was extending `tailwind.config.ts` with custom `fontWeight` entries: `'500': '500', '600': '600', '700': '700', '800': '800'`. This registers them as valid Tailwind utilities, so `@apply font-700` compiles correctly AND they work in JSX classNames. After fixing the config, the `.next` cache was corrupted from the failed build, so I had to delete `.next/` and restart the dev server. That second step took me 10 minutes to figure out — the server kept returning 500s with `__webpack_modules__[moduleId] is not a function` errors that were misleading.

---

## 2. A decision you reversed mid-week, and what made you reverse it

Initially I planned to use an LLM to generate the entire audit analysis — pass in the user's tool stack and let Claude figure out the savings. I had a working prompt by Day 2. But I reversed this for three reasons:

First, the spec explicitly says "knowing when not to use AI is part of the test." Using an LLM to generate financial recommendations is exactly the wrong place for probabilistic output. When someone reads "you could save $340/month by downgrading to Cursor Pro," that number needs to be deterministic and auditable. An LLM might say $320 one time and $360 the next.

Second, I tested the LLM approach with 5 different inputs and found it occasionally recommended plans that don't exist (e.g., "Cursor Personal" — not a real tier), conflated features between tools, and sometimes missed the cross-tool overlap opportunities entirely. The error rate was around 20%, which is unacceptable for a financial tool.

Third, hardcoded rules are debuggable. When a user reports that a recommendation seems wrong, I can trace the exact `if/else` branch in `audit-engine.ts` that produced it. With an LLM, debugging "why did it say this" is non-trivial.

I kept the LLM for the narrative summary — `lib/ai-summary.ts` uses Claude Haiku to write a one-paragraph human-readable overview. Approximate language is fine there ("your team is well-positioned" vs "your team could save $X"). The numbers come from the deterministic engine; the narrative comes from the AI.

---

## 3. What you would build in week 2 if you had it

Three things, in priority order:

**1. Historical pricing tracking.** Right now pricing data is a static file (`lib/pricing-data.ts`) that I manually verify. In week 2, I'd build a weekly cron job that scrapes each vendor's pricing page, diffs it against the stored version, and alerts me when prices change. This has product value — I could show users "Windsurf increased Pro from $15 to $20 on May 2026" in their audit, which builds trust and urgency.

**2. A comparison mode.** Let users run two audits side-by-side — "current stack" vs "optimised stack" — with a visual diff showing which tools to keep, drop, or swap. The current flow is linear (input → results), but a comparison would make the savings feel more concrete and shareable. This would also improve the Credex lead funnel — "here's what your stack looks like today vs. with Credex credits."

**3. Persistent user accounts with audit history.** Currently audits are anonymous one-shots. Adding lightweight auth (magic link via Resend, no password) would let users track their spend over time. "Your AI spend dropped 22% since your last audit" is a retention hook. This also gives Credex richer lead data — knowing a user ran 3 audits over 2 months signals higher intent than a one-time visit.

---

## 4. How you used AI tools

*Which tool, for what tasks, what you didn't trust them with, and one specific time the AI was wrong and you caught it.*

I used Claude (Sonnet) through Cursor as my primary AI assistant throughout the build. Here's the breakdown:

**What I used it for:** Boilerplate generation (API route structure, TypeScript interfaces), CSS utilities (the noise texture SVG overlay, grid background pattern), and writing the initial Supabase schema SQL. I also used it to draft the `reason` strings in the audit engine — the explanations of why each recommendation applies.

**What I didn't trust it with:** The audit engine logic itself. Every `if/else` branch in `audit-engine.ts` was written by me, because the rules encode specific product knowledge (e.g., "Copilot Enterprise's custom docsets only matter at 20+ devs") that the AI couldn't verify against live pricing pages. I also didn't trust it with pricing data — every number in `pricing-data.ts` was manually verified against the vendor's website.

**One specific time the AI was wrong:** When I asked Claude to write the Cursor audit rules, it suggested that Cursor's Business plan includes "unlimited premium model access" as a differentiator over Pro. This is incorrect — both Pro and Business give the same model access and completion quality. The actual differentiator is SSO, centralized billing, and admin controls. I caught this because I had already read the full Cursor pricing FAQ and feature comparison. If I hadn't verified, the audit would have given wrong advice to users considering a downgrade.

**Verification process:** For every AI-generated code block, I read it line-by-line against the relevant documentation before committing. For the pricing data, I had the vendor's pricing page open in one tab and the code in another. For the audit rules, I wrote test cases first (in `__tests__/`) and verified the AI-generated logic produced correct outputs.

---

## 5. Self-rating (1–10) with one-sentence reason each

| Dimension | Rating | Reason |
|-----------|--------|--------|
| Discipline | 7/10 | Committed daily and maintained the devlog, but some days ran shorter than planned due to scope creep on the audit engine rules. |
| Code quality | 8/10 | Clean TypeScript with proper types, adapter patterns, and separation of concerns — but the audit engine could benefit from extracting each tool's rules into separate modules. |
| Design sense | 8/10 | The dark fintech theme with grid backgrounds, glowing savings numbers, and colour-coded tags creates a premium feel that matches the target audience (startup founders/EMs). |
| Problem-solving | 8/10 | The adapter pattern for storage, deterministic audit engine with AI-only-for-narrative, and the Tailwind font weight fix all show good debugging instincts and architectural judgment. |
| Entrepreneurial thinking | 7/10 | The tool genuinely generates leads for Credex's core business (discounted AI credits), but I could have done more user research earlier to validate demand before building. |
