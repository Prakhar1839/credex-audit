# PRICING_DATA.md

All pricing used in the audit engine. Every number traces to an official vendor page.

**Verification requirement:** Before submitting, re-verify each URL and update the date. Prices change. The audit engine will be wrong if this data is stale.

---

## Cursor

| Plan | Price | Source | Verified |
|------|-------|--------|----------|
| Hobby | $0/month | https://cursor.sh/pricing | 2026-05-24 |
| Individual (Pro) | $20/user/month | https://cursor.sh/pricing | 2026-05-24 |
| Teams | $40/user/month | https://cursor.sh/pricing | 2026-05-24 |
| Enterprise | Custom | https://cursor.sh/pricing | 2026-05-24 |

---

## GitHub Copilot

| Plan | Price | Source | Verified |
|------|-------|--------|----------|
| Individual | $10/user/month (or $100/year) | https://github.com/features/copilot#pricing | 2026-05-24 |
| Business | $19/user/month | https://github.com/features/copilot#pricing | 2026-05-24 |
| Enterprise | $39/user/month | https://github.com/features/copilot#pricing | 2026-05-24 |

---

## Claude (Anthropic)

| Plan | Price | Source | Verified |
|------|-------|--------|----------|
| Free | $0 | https://www.anthropic.com/pricing | 2026-05-24 |
| Pro | $20/user/month | https://www.anthropic.com/pricing | 2026-05-24 |
| Max | $100/user/month (5x) / $200/user/month (20x) | https://www.anthropic.com/pricing | 2026-05-24 |
| Team | $25/seat/month (billed monthly) | https://www.anthropic.com/pricing | 2026-05-24 |
| Enterprise | Custom | https://www.anthropic.com/pricing | 2026-05-24 |

---

## Anthropic API (direct)

| Model | Input | Output | Source | Verified |
|-------|-------|--------|--------|----------|
| claude-haiku-4-5 | $0.80/M tokens | $4/M tokens | https://www.anthropic.com/pricing#api | 2026-05-24 |
| claude-sonnet-4 | $3/M tokens | $15/M tokens | https://www.anthropic.com/pricing#api | 2026-05-24 |
| claude-opus-4 | $15/M tokens | $75/M tokens | https://www.anthropic.com/pricing#api | 2026-05-24 |

---

## ChatGPT (OpenAI)

| Plan | Price | Source | Verified |
|------|-------|--------|----------|
| Free | $0 | https://openai.com/chatgpt/pricing/ | 2026-05-24 |
| Plus | $20/user/month | https://openai.com/chatgpt/pricing/ | 2026-05-24 |
| Team | $30/user/month (min 2 seats) | https://openai.com/chatgpt/pricing/ | 2026-05-24 |
| Enterprise | Custom | https://openai.com/chatgpt/pricing/ | 2026-05-24 |

---

## OpenAI API (direct)

| Model | Input | Output | Source | Verified |
|-------|-------|--------|--------|----------|
| GPT-4o mini | $0.15/M tokens | $0.60/M tokens | https://openai.com/api/pricing/ | 2026-05-24 |
| GPT-4o | $2.50/M tokens | $10/M tokens | https://openai.com/api/pricing/ | 2026-05-24 |
| o1 | $15/M tokens | $60/M tokens | https://openai.com/api/pricing/ | 2026-05-24 |

---

## Gemini (Google)

| Plan | Price | Source | Verified |
|------|-------|--------|----------|
| Free | $0 | https://gemini.google.com/advanced | 2026-05-24 |
| Advanced (Google One AI Premium) | $20/user/month | https://one.google.com/about/ai-premium | 2026-05-24 |
| API (Flash) | $0.075/M tokens input | https://ai.google.dev/pricing | 2026-05-24 |

---

## Windsurf (Codeium)

| Plan | Price | Source | Verified |
|------|-------|--------|----------|
| Free | $0 | https://windsurf.com/pricing | 2026-05-24 |
| Pro | $20/user/month | https://windsurf.com/pricing | 2026-05-24 |
| Teams | $40/user/month | https://windsurf.com/pricing | 2026-05-24 |

---

> **Note on audit engine estimates for usage-based APIs:** Savings estimates for API spend (Anthropic, OpenAI) are calculated as a percentage of reported spend, not derived from token prices. This is intentional — we don't know the user's actual token mix. The percentage (20%) is a conservative estimate based on typical model-mix optimisations (e.g. routing cheaper queries to Haiku/GPT-4o mini).
