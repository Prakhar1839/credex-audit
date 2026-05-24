// __tests__/audit-engine.test.ts
import { describe, it, expect } from "vitest";
import { runAudit } from "@/lib/audit-engine";
import type { AuditInput } from "@/lib/audit-engine";

// ── Test 1: Cursor Business with small team → recommend downgrade ─────────────
describe("Cursor Business downgrade", () => {
  it("recommends downgrading to Pro when team is fewer than 5 seats", () => {
    const input: AuditInput = {
      tools: [
        { toolId: "cursor", planId: "business", monthlySpend: 120, seats: 3 },
      ],
      teamSize: 3,
      primaryUseCase: "coding",
    };
    const result = runAudit(input);
    const cursorResult = result.results.find((r) => r.toolId === "cursor");

    expect(cursorResult?.recommendation).toBe("downgrade_plan");
    expect(cursorResult?.monthlySavings).toBeGreaterThan(0);
    expect(cursorResult?.monthlySavings).toBe(3 * (40 - 20)); // $60/mo
  });
});

// ── Test 2: Copilot + Cursor → flag consolidation ─────────────────────────────
describe("Copilot + Cursor overlap", () => {
  it("flags GitHub Copilot as redundant when Cursor Pro is also enabled", () => {
    const input: AuditInput = {
      tools: [
        { toolId: "cursor", planId: "pro", monthlySpend: 100, seats: 5 },
        { toolId: "github_copilot", planId: "business", monthlySpend: 95, seats: 5 },
      ],
      teamSize: 5,
      primaryUseCase: "coding",
    };
    const result = runAudit(input);
    const copilotResult = result.results.find((r) => r.toolId === "github_copilot");

    expect(copilotResult?.recommendation).toBe("consolidate");
    expect(copilotResult?.monthlySavings).toBe(95); // full Copilot spend
    expect(result.totalMonthlySavings).toBe(95);
  });
});

// ── Test 3: High API spend → review_api_spend + savings estimate ──────────────
describe("High Anthropic API spend", () => {
  it("flags high API spend and estimates 20% savings", () => {
    const input: AuditInput = {
      tools: [
        { toolId: "anthropic_api", planId: "direct", monthlySpend: 1000, seats: 1 },
      ],
      teamSize: 5,
      primaryUseCase: "data",
    };
    const result = runAudit(input);
    const apiResult = result.results[0];

    expect(apiResult.recommendation).toBe("review_api_spend");
    expect(apiResult.monthlySavings).toBe(200); // 20% of $1000
    expect(apiResult.annualSavings).toBe(2400);
  });
});

// ── Test 4: Well-optimised stack → already_optimal ────────────────────────────
describe("Optimal stack", () => {
  it("marks tools as already_optimal when no savings are found", () => {
    const input: AuditInput = {
      tools: [
        { toolId: "cursor", planId: "pro", monthlySpend: 60, seats: 3 },
      ],
      teamSize: 3,
      primaryUseCase: "coding",
    };
    const result = runAudit(input);
    const cursorResult = result.results[0];

    expect(cursorResult.recommendation).toBe("already_optimal");
    expect(cursorResult.monthlySavings).toBe(0);
    expect(result.totalMonthlySavings).toBe(0);
    expect(result.isOptimal).toBe(true);
  });
});

// ── Test 5: isHighSavings flag when savings > $500 ────────────────────────────
describe("isHighSavings flag", () => {
  it("sets isHighSavings=true when total savings exceed $500/month", () => {
    const input: AuditInput = {
      tools: [
        { toolId: "cursor", planId: "business", monthlySpend: 800, seats: 20 },
        { toolId: "github_copilot", planId: "business", monthlySpend: 380, seats: 20 },
        { toolId: "anthropic_api", planId: "direct", monthlySpend: 2000, seats: 1 },
      ],
      teamSize: 20,
      primaryUseCase: "coding",
    };
    const result = runAudit(input);
    expect(result.isHighSavings).toBe(true);
    expect(result.totalMonthlySavings).toBeGreaterThan(500);
  });
});

// ── Test 6: totalAnnualSavings = 12 × totalMonthlySavings ─────────────────────
describe("Annual savings calculation", () => {
  it("computes annual savings as 12× monthly savings", () => {
    const input: AuditInput = {
      tools: [
        { toolId: "cursor", planId: "business", monthlySpend: 120, seats: 3 },
      ],
      teamSize: 3,
      primaryUseCase: "coding",
    };
    const result = runAudit(input);
    expect(result.totalAnnualSavings).toBe(result.totalMonthlySavings * 12);
  });
});

// ── Test 7: Copilot Enterprise → Business downgrade for small teams ────────────
describe("Copilot Enterprise downgrade", () => {
  it("recommends Business plan for teams under 20 seats on Enterprise", () => {
    const input: AuditInput = {
      tools: [
        { toolId: "github_copilot", planId: "enterprise", monthlySpend: 390, seats: 10 },
      ],
      teamSize: 10,
      primaryUseCase: "coding",
    };
    const result = runAudit(input);
    const copilotResult = result.results[0];

    expect(copilotResult.recommendation).toBe("downgrade_plan");
    expect(copilotResult.monthlySavings).toBe(10 * (39 - 19)); // $200/mo
  });
});
