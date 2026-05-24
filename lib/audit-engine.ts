// lib/audit-engine.ts
// The audit logic. Rules are hardcoded — knowing when NOT to use AI is intentional.
// Each recommendation must be explainable to a finance-literate person.

import { TOOLS, type ToolId, type UseCase } from "./pricing-data";

export interface ToolEntry {
  toolId: ToolId;
  planId: string;
  monthlySpend: number; // what they actually pay in $
  seats: number;
}

export interface AuditInput {
  tools: ToolEntry[];
  teamSize: number;
  primaryUseCase: UseCase;
}

export type RecommendationType =
  | "downgrade_plan"       // same vendor, cheaper plan
  | "reduce_seats"         // same plan, fewer seats
  | "switch_tool"          // different vendor
  | "already_optimal"      // no savings found
  | "review_api_spend"     // usage-based — flag high spend
  | "consolidate"          // paying for overlapping tools
  | "credits_available";   // Credex can provide discount

export interface ToolAuditResult {
  toolId: ToolId;
  toolName: string;
  currentPlanLabel: string;
  currentMonthlySpend: number;
  seats: number;
  recommendation: RecommendationType;
  recommendedPlanLabel?: string;
  recommendedTool?: string;
  monthlySavings: number;
  annualSavings: number;
  reason: string;
  credexApplicable: boolean; // true if Credex can supply discounted credits
}

export interface AuditResult {
  id?: string;
  input: AuditInput;
  results: ToolAuditResult[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  aiSummary?: string;
  createdAt?: string;
  isHighSavings: boolean; // >$500/mo
  isOptimal: boolean;      // <$100/mo savings
}

// Tools Credex can supply discounted credits for
const CREDEX_SUPPORTED: ToolId[] = [
  "cursor",
  "github_copilot",
  "claude",
  "chatgpt",
  "anthropic_api",
  "openai_api",
];

export function runAudit(input: AuditInput): AuditResult {
  const { tools, teamSize, primaryUseCase } = input;
  const results: ToolAuditResult[] = [];

  // Detect which categories the user has tools in
  const hasCodingTool = tools.some((t) =>
    ["cursor", "github_copilot", "windsurf"].includes(t.toolId)
  );
  const hasLLMChat = tools.some((t) =>
    ["claude", "chatgpt", "gemini"].includes(t.toolId)
  );

  for (const entry of tools) {
    const result = auditSingleTool(entry, teamSize, primaryUseCase, tools);
    results.push(result);
  }

  // Cross-tool: flag duplicate coding assistants
  // Only run if the per-tool pass didn't already handle consolidation for ALL coding tools.
  const codingTools = tools.filter((t) =>
    ["cursor", "github_copilot", "windsurf"].includes(t.toolId)
  );
  const anyConsolidatedAlready = codingTools.some((t) =>
    results.find((r) => r.toolId === t.toolId && r.monthlySavings > 0)
  );
  if (codingTools.length >= 2 && !anyConsolidatedAlready) {
    // Mark the more expensive one as a consolidation target
    const sorted = [...codingTools].sort(
      (a, b) => b.monthlySpend - a.monthlySpend
    );
    const expensive = sorted[0];
    const existingResult = results.find((r) => r.toolId === expensive.toolId);
    if (existingResult && existingResult.monthlySavings === 0) {
      existingResult.recommendation = "consolidate";
      existingResult.monthlySavings = expensive.monthlySpend;
      existingResult.annualSavings = expensive.monthlySpend * 12;
      existingResult.reason = `You're paying for ${codingTools.length} coding assistants simultaneously. ${existingResult.toolName} and ${results.find(r => r.toolId !== expensive.toolId && codingTools.map(c => c.toolId).includes(r.toolId))?.toolName ?? "another tool"} overlap heavily in capability. Consolidate to one — the best choice for your team is likely Cursor Pro or Windsurf Pro depending on model preferences.`;
    }
  }

  // Cross-tool: flag duplicate LLM chat tools
  const chatTools = tools.filter((t) =>
    ["claude", "chatgpt", "gemini"].includes(t.toolId)
  );
  if (chatTools.length >= 2 && primaryUseCase !== "mixed") {
    const sorted = [...chatTools].sort(
      (a, b) => b.monthlySpend - a.monthlySpend
    );
    const expensive = sorted[0];
    const existingResult = results.find((r) => r.toolId === expensive.toolId);
    if (existingResult && existingResult.monthlySavings === 0) {
      existingResult.recommendation = "consolidate";
      existingResult.monthlySavings = Math.round(expensive.monthlySpend * 0.5);
      existingResult.annualSavings = existingResult.monthlySavings * 12;
      existingResult.reason = `Your team pays for ${chatTools.length} LLM chat tools. For a ${primaryUseCase} use-case, most teams find one model covers 90%+ of their needs. Consolidating saves ~50% of the overlapping cost.`;
    }
  }

  const totalMonthlySavings = results.reduce(
    (sum, r) => sum + r.monthlySavings,
    0
  );

  return {
    input,
    results,
    totalMonthlySavings,
    totalAnnualSavings: totalMonthlySavings * 12,
    isHighSavings: totalMonthlySavings > 500,
    isOptimal: totalMonthlySavings < 100,
    createdAt: new Date().toISOString(),
  };
}

function auditSingleTool(
  entry: ToolEntry,
  teamSize: number,
  useCase: UseCase,
  allTools: ToolEntry[]
): ToolAuditResult {
  const { toolId, planId, monthlySpend, seats } = entry;
  const tool = TOOLS[toolId];
  const currentPlan = tool.plans.find((p) => p.id === planId);
  const credexApplicable = CREDEX_SUPPORTED.includes(toolId);

  const base: Omit<ToolAuditResult, "recommendation" | "monthlySavings" | "annualSavings" | "reason"> = {
    toolId,
    toolName: tool.name,
    currentPlanLabel: currentPlan?.label ?? planId,
    currentMonthlySpend: monthlySpend,
    seats,
    credexApplicable,
  };

  // ── Cursor ──────────────────────────────────────────────────────────────
  if (toolId === "cursor") {
    // Business plan but small team (< 5) — Pro is identical for features that matter
    if (planId === "business" && seats < 5) {
      const savings = seats * (40 - 20);
      return {
        ...base,
        recommendation: "downgrade_plan",
        recommendedPlanLabel: "Pro",
        monthlySavings: savings,
        annualSavings: savings * 12,
        reason: `Cursor Business costs $40/seat/month but adds only SSO and centralized billing over Pro ($20/seat). With ${seats} seats, you're paying a $${savings}/month premium primarily for admin features. Unless you have a compliance requirement for SSO, Pro gives the same completions and model access. Downgrade saves $${savings}/month.`,
      };
    }
    // Pro but use-case is writing/research — Cursor is a coding IDE, wrong tool
    if (planId === "pro" && (useCase === "writing" || useCase === "research")) {
      return {
        ...base,
        recommendation: "switch_tool",
        recommendedTool: "Claude Pro or ChatGPT Plus",
        monthlySavings: Math.max(0, monthlySpend - 20),
        annualSavings: Math.max(0, monthlySpend - 20) * 12,
        reason: `Cursor is optimised for code editing workflows — it's an IDE, not a general LLM chat interface. For ${useCase} workflows, Claude Pro or ChatGPT Plus at $20/user/month gives better document editing, long-form writing, and research capabilities. You may not need Cursor at all for non-coding tasks.`,
      };
    }
    // Seats significantly exceed team coding size
    if (seats > teamSize) {
      const rightSeats = teamSize;
      const savings = (seats - rightSeats) * (currentPlan?.pricePerSeat ?? 20);
      return {
        ...base,
        recommendation: "reduce_seats",
        monthlySavings: savings,
        annualSavings: savings * 12,
        reason: `You're paying for ${seats} Cursor seats but have ${teamSize} people on the team. Reducing to ${rightSeats} seats saves $${savings}/month. Cursor seats should match active developers, not total headcount.`,
      };
    }
    return optimal(base);
  }

  // ── GitHub Copilot ───────────────────────────────────────────────────────
  if (toolId === "github_copilot") {
    if (planId === "enterprise" && seats < 20) {
      const savings = seats * (39 - 19);
      return {
        ...base,
        recommendation: "downgrade_plan",
        recommendedPlanLabel: "Business",
        monthlySavings: savings,
        annualSavings: savings * 12,
        reason: `Copilot Enterprise ($39/seat) adds custom docsets and fine-tuned models over Business ($19/seat). These features deliver meaningful value only when your codebase is large enough to warrant custom training — typically 20+ developers. At ${seats} seats, the $${savings}/month premium is unlikely to pay back. Business covers completions, chat, and audit logs.`,
      };
    }
    if (planId === "business" && seats <= 3) {
      const savings = seats * (19 - 10);
      return {
        ...base,
        recommendation: "downgrade_plan",
        recommendedPlanLabel: "Individual (×${seats})",
        monthlySavings: savings,
        annualSavings: savings * 12,
        reason: `Copilot Business ($19/seat) adds policy management and audit logs. With ${seats} seats, you're unlikely to need centralized policy enforcement — Individual plans ($10/seat) cover all the code completion and chat features. Saving $${savings}/month. Note: Individual plans require each person to manage their own subscription.`,
      };
    }
    // If team also has Cursor Pro — Copilot is mostly redundant
    const hasCursor = allTools.some((t) => t.toolId === "cursor" && t.planId !== "hobby");
    if (hasCursor) {
      return {
        ...base,
        recommendation: "consolidate",
        monthlySavings: monthlySpend,
        annualSavings: monthlySpend * 12,
        reason: `You're paying for both Cursor and GitHub Copilot. Both provide inline completions and chat inside your IDE — the overlap is ~80%+. Cursor's Pro/Business plan includes access to Claude and GPT-4o completions, which largely covers Copilot's feature set. Dropping Copilot saves $${monthlySpend}/month.`,
      };
    }
    return optimal(base);
  }

  // ── Claude ───────────────────────────────────────────────────────────────
  if (toolId === "claude") {
    if (planId === "team" && seats < 5) {
      // Team requires min 5 seats; if they're paying for 5 but only using 2-3
      const rightSeats = Math.max(seats, 1);
      const diff = 5 - rightSeats;
      if (diff > 0 && seats < 4) {
        const savings = diff * 30;
        return {
          ...base,
          recommendation: "reduce_seats",
          recommendedPlanLabel: "Claude Pro (individual)",
          monthlySavings: savings,
          annualSavings: savings * 12,
          reason: `Claude Team requires a minimum of 5 seats at $30/seat. If your team has ${seats} active Claude users, you're paying for ${5 - seats} unused seats. Switching those users to individual Claude Pro plans ($20/seat) saves $${savings}/month and they retain Sonnet 4 access. Team features (shared Projects, admin console) matter only once you hit 5+ regular users.`,
        };
      }
    }
    if (planId === "max" && useCase === "coding") {
      return {
        ...base,
        recommendation: "downgrade_plan",
        recommendedPlanLabel: "Pro",
        monthlySavings: 80 * seats,
        annualSavings: 80 * seats * 12,
        reason: `Claude Max ($100/user) is designed for power users hitting Pro's usage ceiling daily. For coding workflows, Cursor Pro already bundles Claude Sonnet access and model API calls — paying $100/month separately for Claude.ai is likely double-counting. Downgrade to Claude Pro ($20) for web access and let your coding editor handle the heavy lifting.`,
      };
    }
    if (planId === "pro" && seats > 1) {
      return {
        ...base,
        recommendation: "downgrade_plan",
        recommendedPlanLabel: "Team (if ≥5 users)",
        monthlySavings: seats >= 5 ? 0 : 0, // Team is $30 vs Pro $20 — only recommend if seats ≥5
        annualSavings: 0,
        reason:
          seats >= 5
            ? `With ${seats} users on Claude Pro, upgrading to Claude Team ($30/seat) gives shared Projects, admin controls, and higher rate limits. It costs more per seat but the productivity gain from shared project context is usually worth it at this team size.`
            : `Your ${seats} users on Claude Pro are well-positioned. Team plan ($30/seat, min 5) would cost more. Stick with Pro.`,
      };
    }
    return optimal(base);
  }

  // ── ChatGPT ──────────────────────────────────────────────────────────────
  if (toolId === "chatgpt") {
    if (planId === "team" && seats < 5) {
      const proPriceTotal = seats * 20;
      const teamPriceTotal = Math.max(seats, 2) * 30;
      const savings = teamPriceTotal - proPriceTotal;
      if (savings > 0) {
        return {
          ...base,
          recommendation: "downgrade_plan",
          recommendedPlanLabel: "Plus (individual)",
          monthlySavings: savings,
          annualSavings: savings * 12,
          reason: `ChatGPT Team ($30/seat, min 2) adds a shared workspace and admin console over Plus ($20/seat). With only ${seats} seats, the admin overhead isn't needed and you're paying $${savings}/month more than necessary. Plus gives the same GPT-4o, o1, and DALL-E access for individual use.`,
        };
      }
    }
    // If team has Claude too and use-case isn't mixed
    const hasClaude = allTools.some((t) => t.toolId === "claude");
    if (hasClaude && useCase !== "mixed" && useCase !== "data") {
      return {
        ...base,
        recommendation: "consolidate",
        monthlySavings: Math.round(monthlySpend * 0.5),
        annualSavings: Math.round(monthlySpend * 0.5) * 12,
        reason: `You're paying for both Claude and ChatGPT. For a ${useCase} use case, one frontier model is typically sufficient. Claude 3.5 Sonnet and GPT-4o have near-equivalent capability for most tasks — consolidating to one saves ~50% of your chat tool spend. Teams often keep both for model preference, but if usage is light on one, consolidate.`,
      };
    }
    return optimal(base);
  }

  // ── Anthropic API ────────────────────────────────────────────────────────
  if (toolId === "anthropic_api") {
    if (monthlySpend > 500) {
      return {
        ...base,
        recommendation: "review_api_spend",
        monthlySavings: Math.round(monthlySpend * 0.2),
        annualSavings: Math.round(monthlySpend * 0.2) * 12,
        reason: `Your Anthropic API spend of $${monthlySpend}/month is significant. Common optimisation levers: (1) Switch non-latency-sensitive calls from Sonnet ($3/$15 per M tokens) to Haiku ($0.80/$4) — Haiku handles classification, summarisation, and extraction well at 4–6× lower cost. (2) Implement prompt caching if you're sending repeated context. (3) Credex offers discounted Anthropic API credits — estimate 15–25% off retail for your volume. Estimated savings shown are conservative.`,
      };
    }
    if (monthlySpend > 100) {
      return {
        ...base,
        recommendation: "credits_available",
        monthlySavings: Math.round(monthlySpend * 0.15),
        annualSavings: Math.round(monthlySpend * 0.15) * 12,
        reason: `At $${monthlySpend}/month in Anthropic API spend, you're a candidate for discounted credits through Credex (sourced from companies that overforecast). Typical discount: 15–20% off retail. No lock-in — same API, same models, lower unit cost.`,
      };
    }
    return optimal(base);
  }

  // ── OpenAI API ───────────────────────────────────────────────────────────
  if (toolId === "openai_api") {
    if (monthlySpend > 500) {
      return {
        ...base,
        recommendation: "review_api_spend",
        monthlySavings: Math.round(monthlySpend * 0.2),
        annualSavings: Math.round(monthlySpend * 0.2) * 12,
        reason: `Your OpenAI API spend of $${monthlySpend}/month has optimisation room. Primary levers: (1) GPT-4o mini ($0.15/$0.60 per M tokens) vs GPT-4o ($2.50/$10) — mini handles most NLP tasks at 10–15× lower cost, use 4o only where top-tier reasoning is required. (2) Batch API gives 50% off for non-realtime workloads. (3) Credex offers discounted OpenAI credits. Estimated savings are conservative.`,
      };
    }
    if (monthlySpend > 100) {
      return {
        ...base,
        recommendation: "credits_available",
        monthlySavings: Math.round(monthlySpend * 0.15),
        annualSavings: Math.round(monthlySpend * 0.15) * 12,
        reason: `At $${monthlySpend}/month in OpenAI API spend, discounted credits through Credex can reduce your unit cost by 15–20%. Same API endpoint, same models — just lower cost per token.`,
      };
    }
    return optimal(base);
  }

  // ── Gemini ───────────────────────────────────────────────────────────────
  if (toolId === "gemini") {
    if (planId === "advanced" && seats > 1) {
      return {
        ...base,
        recommendation: "switch_tool",
        recommendedTool: "Claude Team or ChatGPT Team",
        monthlySavings: 0,
        annualSavings: 0,
        reason: `Gemini Advanced is a personal subscription ($20/user via Google One AI Premium) bundled with 2TB storage. It doesn't have a native team workspace. If you're running ${seats} users, Claude Team ($30/seat with shared Projects) or ChatGPT Team ($30/seat) is a better organisational fit, even at similar per-seat cost, because you get admin controls and shared context. Only keep Gemini Advanced if the Google storage or Workspace integration is the primary value.`,
      };
    }
    return optimal(base);
  }

  // ── Windsurf ─────────────────────────────────────────────────────────────
  if (toolId === "windsurf") {
    if (planId === "teams" && seats < 5) {
      const savings = seats * (35 - 15);
      return {
        ...base,
        recommendation: "downgrade_plan",
        recommendedPlanLabel: "Pro",
        monthlySavings: savings,
        annualSavings: savings * 12,
        reason: `Windsurf Teams ($35/seat) adds SSO, usage analytics, and team management over Pro ($15/seat). With only ${seats} developers, the admin features don't justify a $${savings}/month premium. Windsurf Pro gives the same model access and Flows. Downgrade saves $${savings}/month.`,
      };
    }
    // If also has Cursor
    const hasCursor = allTools.some((t) => t.toolId === "cursor" && t.planId !== "hobby");
    if (hasCursor) {
      return {
        ...base,
        recommendation: "consolidate",
        monthlySavings: monthlySpend,
        annualSavings: monthlySpend * 12,
        reason: `Cursor and Windsurf both provide AI-powered code completions and inline chat. Maintaining both is redundant — most developers settle on one after a trial period. Drop the one your team uses less. Cursor's larger ecosystem and Windsurf's Flows are the differentiators — pick based on that.`,
      };
    }
    return optimal(base);
  }

  return optimal(base);
}

function optimal(
  base: Omit<ToolAuditResult, "recommendation" | "monthlySavings" | "annualSavings" | "reason">
): ToolAuditResult {
  return {
    ...base,
    recommendation: "already_optimal",
    monthlySavings: 0,
    annualSavings: 0,
    reason: `Your ${base.toolName} setup looks right-sized for your team. No material savings identified.`,
  };
}
