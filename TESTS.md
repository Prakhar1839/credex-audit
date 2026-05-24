# TESTS.md

All tests cover the audit engine — the deterministic core of the product where correctness matters most.

## Test file: `__tests__/audit-engine.test.ts`

Run with: `npm test`

| # | Test name | What it covers |
|---|-----------|----------------|
| 1 | Cursor Business downgrade | Cursor Business plan with <5 seats should recommend downgrade to Pro; verifies savings calculation of `seats × (40-20)` |
| 2 | Copilot + Cursor overlap | When both Cursor Pro and GitHub Copilot are active, Copilot should be flagged as `consolidate` with full Copilot spend as savings |
| 3 | High Anthropic API spend | API spend >$500/mo triggers `review_api_spend` with exactly 20% estimated savings |
| 4 | Optimal stack | Cursor Pro at the right seat count → `already_optimal`, zero savings, `isOptimal: true` |
| 5 | isHighSavings flag | Multi-tool stack where total savings >$500/mo correctly sets `isHighSavings: true` |
| 6 | Annual savings calculation | `totalAnnualSavings` is always exactly `12 × totalMonthlySavings` |
| 7 | Copilot Enterprise downgrade | Enterprise plan with <20 seats → `downgrade_plan` to Business; verifies `seats × (39-19)` savings |

## How to run

```bash
npm test                 # run once
npm run test:watch       # watch mode
```

All 7 tests should pass with no environment variables needed.
