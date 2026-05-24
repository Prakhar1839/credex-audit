# METRICS.md

## North Star Metric

**Audits completed per week.**

Not sessions, not pageviews, not emails captured. An audit completed means a user entered real data and got a result — they experienced the core value. This metric directly measures whether the tool is doing its job and is the leading indicator for every business outcome (leads, consultations, deals).

*Why not "emails captured"?* Email capture is a vanishing rate — optimising for it can make the product feel like a lead magnet rather than a tool people want. *Why not "deals closed"?* That's a lagging metric with too much noise from the Credex sales process. Audits completed is the right lever to pull.

---

## 3 Input Metrics That Drive the North Star

**1. Form completion rate** (visitors who start the form → complete an audit)
Target: ≥35%. If this drops, the form has friction. Look at drop-off by step — if users abandon at the tool selection step, the checkboxes are confusing. If they abandon at submit, there's likely a validation error or trust issue.

**2. Share rate** (audits that generate a shared link viewed by someone else)
Target: ≥8% of audits. This is the viral coefficient. Every share is a free acquisition. Track by session: if a user shares their result and someone else opens the link and completes their own audit, that's a K-factor event.

**3. High-savings rate** (audits showing >$500/mo savings)
Target: ≥25% of audits. This is both a product quality signal (are we finding real overspend?) and a business signal (are we generating Credex-relevant leads?). If this drops, either the user base shifted to already-optimised stacks, or the audit rules are missing real patterns.

---

## What to Instrument First

1. `audit_started` — user clicks into the form (distinguishes engaged visitors from bouncers)
2. `audit_completed` — audit API returns successfully (North Star)
3. `audit_form_step` — which step users are on when they abandon
4. `email_captured` — lead form submitted
5. `share_link_copied` — user clicks the copy button on the results page
6. `share_link_opened` — someone opens a `/audit/{id}` URL directly (not from our site)
7. `credex_cta_clicked` — "Book a call" clicked on high-savings results

Use PostHog (free tier, self-hostable) or Plausible. Avoid Google Analytics — privacy-conscious founders notice.

---

## What Number Triggers a Pivot Decision

**Pivot trigger: Form completion rate <15% for 2 consecutive weeks with >500 form starts.**

At 15%, the form is losing more than it's gaining. The root cause is almost certainly friction in the tool entry step (too many required fields, confusing plan dropdowns, no clear "why do you need my spend?"). The pivot isn't product-level — it's a redesign of the form UX. Specifically: move to a simpler "$X/month total on AI tools, broken down how?" rather than tool-by-tool input.

**Secondary trigger: High-savings rate <10% for 2 weeks.**

If fewer than 1 in 10 audits finds meaningful savings, either the target user (already overpaying startups) isn't reaching the tool, or the audit rules are miscalibrated. Check whether the user base has shifted to solo developers (low spend, low savings) vs teams (high spend, high savings). If yes, tighten distribution to reach engineering managers, not individual developers.
