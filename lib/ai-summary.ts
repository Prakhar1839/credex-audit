// lib/ai-summary.ts
// Generates a ~100-word personalised audit summary via Anthropic API.
// Falls back to a templated summary if the API call fails.

import type { AuditResult } from "./audit-engine";

export async function generateAiSummary(audit: AuditResult): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("[ai-summary] No ANTHROPIC_API_KEY — using fallback summary");
    return generateFallbackSummary(audit);
  }

  const toolList = audit.results
    .map((r) => `${r.toolName} (${r.currentPlanLabel}, $${r.currentMonthlySpend}/mo)`)
    .join(", ");

  const savingsLine =
    audit.totalMonthlySavings > 0
      ? `Total potential savings: $${audit.totalMonthlySavings}/month ($${audit.totalAnnualSavings}/year).`
      : `Spend appears well-optimised. No material savings identified.`;

  const topFindings = audit.results
    .filter((r) => r.monthlySavings > 0)
    .sort((a, b) => b.monthlySavings - a.monthlySavings)
    .slice(0, 3)
    .map((r) => `${r.toolName}: ${r.reason.split(".")[0]}.`)
    .join(" ");

  const prompt = `You are writing a concise, direct audit summary for a startup founder or engineering manager. 
No fluff, no AI-assistant voice. Sound like a sharp CFO advisor.

Audit data:
- Team size: ${audit.input.teamSize}
- Primary use case: ${audit.input.primaryUseCase}
- Tools: ${toolList}
- ${savingsLine}
- Key findings: ${topFindings || "No major overspend found."}

Write exactly one paragraph (90–110 words) that:
1. Opens with the most important finding or an honest "you're spending well"
2. Names 1–2 specific tools and explains why (use numbers)
3. Ends with a concrete next step

Do not use bullet points. Do not start with "Based on". Do not use em-dashes excessively. Be direct and specific.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[ai-summary] API error:", response.status, err);
      return generateFallbackSummary(audit);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";

    if (!text) {
      return generateFallbackSummary(audit);
    }

    return text.trim();
  } catch (err) {
    console.error("[ai-summary] Fetch failed:", err);
    return generateFallbackSummary(audit);
  }
}

// Templated fallback — still useful and personalised
function generateFallbackSummary(audit: AuditResult): string {
  const { totalMonthlySavings, totalAnnualSavings, input, results } = audit;

  if (totalMonthlySavings === 0) {
    const toolNames = results.map((r) => r.toolName).join(", ");
    return `Your AI stack — ${toolNames} — is well-calibrated for a ${input.teamSize}-person team focused on ${input.primaryUseCase}. No material overspend was found. Bookmark this tool: as your team grows or new models launch, your optimal mix will shift. Return quarterly for a re-audit.`;
  }

  const topResult = [...results].sort((a, b) => b.monthlySavings - a.monthlySavings)[0];
  const useCase = input.primaryUseCase;
  const plural = input.teamSize === 1 ? "your" : `your ${input.teamSize}-person team's`;

  return `${plural} AI spend has $${totalMonthlySavings}/month ($${totalAnnualSavings}/year) in recoverable costs. The biggest opportunity is ${topResult.toolName}: ${topResult.reason.split(".")[0]}. For a ${useCase}-focused team, right-sizing tool plans to actual usage and eliminating redundant subscriptions is the fastest path to savings — no productivity impact. Review the recommendations below and prioritise the changes with the highest dollar savings first.`;
}
