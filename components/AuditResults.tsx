"use client";
// components/AuditResults.tsx

import { useState } from "react";
import type { AuditResult, ToolAuditResult, RecommendationType } from "@/lib/audit-engine";
import { formatCurrency } from "@/lib/utils";

const REC_LABELS: Record<RecommendationType, string> = {
  downgrade_plan: "Downgrade plan",
  reduce_seats: "Reduce seats",
  switch_tool: "Switch tool",
  already_optimal: "Optimal ✓",
  review_api_spend: "Optimise API spend",
  consolidate: "Consolidate",
  credits_available: "Discount available",
};

const REC_COLORS: Record<RecommendationType, string> = {
  downgrade_plan: "tag-amber",
  reduce_seats: "tag-amber",
  switch_tool: "tag-amber",
  already_optimal: "tag-green",
  review_api_spend: "tag-red",
  consolidate: "tag-red",
  credits_available: "tag-green",
};

function AnimatedNumber({ value }: { value: number }) {
  return (
    <span className="font-mono tabular-nums">{formatCurrency(value)}</span>
  );
}

function ToolCard({ result }: { result: ToolAuditResult }) {
  const [expanded, setExpanded] = useState(false);
  const hasData = result.monthlySavings > 0;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${
        hasData ? "border-bg-border" : "border-bg-border/60"
      }`}
    >
      <button
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-bg-elevated/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Savings indicator */}
        <div
          className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${
            result.monthlySavings > 200
              ? "bg-brand-red"
              : result.monthlySavings > 0
              ? "bg-brand-amber"
              : "bg-brand-green/40"
          }`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-600 text-sm text-text-primary">
              {result.toolName}
            </span>
            <span className="text-xs text-text-muted">{result.currentPlanLabel}</span>
            {result.recommendedPlanLabel && (
              <span className="text-xs text-text-muted">
                → {result.recommendedPlanLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={REC_COLORS[result.recommendation]}>
              {REC_LABELS[result.recommendation]}
            </span>
            {result.credexApplicable && result.monthlySavings > 0 && (
              <span className="tag-green">Credex discount eligible</span>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          {result.monthlySavings > 0 ? (
            <>
              <div className="text-brand-green font-mono font-500 text-sm">
                -{formatCurrency(result.monthlySavings)}/mo
              </div>
              <div className="text-text-muted text-xs">
                -{formatCurrency(result.annualSavings)}/yr
              </div>
            </>
          ) : (
            <div className="text-text-muted text-xs font-mono">
              {formatCurrency(result.currentMonthlySpend)}/mo
            </div>
          )}
        </div>

        <svg
          className={`w-4 h-4 text-text-muted transition-transform flex-shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-bg-border pt-4">
          <p className="text-sm text-text-secondary leading-relaxed">{result.reason}</p>
          <div className="mt-3 flex gap-4 text-xs text-text-muted font-mono">
            <span>Current: {formatCurrency(result.currentMonthlySpend)}/mo</span>
            <span>Seats: {result.seats}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  audit: AuditResult & { id: string };
  shareUrl: string;
  onCaptureEmail: () => void;
  leadCaptured: boolean;
}

export default function AuditResults({
  audit,
  shareUrl,
  onCaptureEmail,
  leadCaptured,
}: Props) {
  const [copied, setCopied] = useState(false);

  function copyShare() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalCurrentSpend = audit.results.reduce(
    (s, r) => s + r.currentMonthlySpend,
    0
  );
  const savingsPct =
    totalCurrentSpend > 0
      ? Math.round((audit.totalMonthlySavings / totalCurrentSpend) * 100)
      : 0;

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Hero */}
      <div className="text-center mb-10 animate-fade-up">
        {audit.isOptimal && audit.totalMonthlySavings < 100 ? (
          <>
            <div className="tag-green text-base mb-4 mx-auto inline-flex">
              Well-optimised ✓
            </div>
            <h2 className="font-display font-800 text-3xl text-text-primary mb-2">
              You&apos;re spending well.
            </h2>
            <p className="text-text-secondary text-sm">
              No material overspend detected. Potential savings under $100/month.
            </p>
          </>
        ) : (
          <>
            <div className="text-text-secondary text-sm mb-2 font-mono">
              Potential monthly savings
            </div>
            <div className="savings-glow font-display font-800 text-6xl text-brand-green mb-1">
              {formatCurrency(audit.totalMonthlySavings)}
            </div>
            <div className="text-text-secondary text-sm">
              {formatCurrency(audit.totalAnnualSavings)}/year ·{" "}
              {savingsPct}% of current spend
            </div>
          </>
        )}
      </div>

      {/* AI Summary */}
      {audit.aiSummary && (
        <div className="card mb-6 animate-fade-up animate-delay-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
            <span className="text-xs font-mono text-text-muted">AI SUMMARY</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">
            {audit.aiSummary}
          </p>
        </div>
      )}

      {/* Credex CTA for high savings */}
      {audit.isHighSavings && (
        <div className="border border-brand-green/30 bg-brand-green/5 rounded-xl p-5 mb-6 animate-fade-up animate-delay-200">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="font-display font-700 text-text-primary mb-1">
                Save even more with Credex
              </div>
              <p className="text-sm text-text-secondary">
                Credex supplies discounted AI credits — same tools, lower unit cost.
                At your savings level, a 15-min call often unlocks an extra{" "}
                <span className="text-brand-green font-mono">
                  {formatCurrency(Math.round(audit.totalMonthlySavings * 0.2))}/mo
                </span>{" "}
                on top of plan optimisations.
              </p>
            </div>
            <a
              href="https://credex.rocks"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary whitespace-nowrap text-xs"
            >
              Book a call →
            </a>
          </div>
        </div>
      )}

      {/* Tool breakdown */}
      <h3 className="font-display font-700 text-sm text-text-secondary mb-3 animate-fade-up animate-delay-200">
        TOOL BREAKDOWN
      </h3>
      <div className="space-y-3 mb-8 animate-fade-up animate-delay-300">
        {[...audit.results]
          .sort((a, b) => b.monthlySavings - a.monthlySavings)
          .map((result) => (
            <ToolCard key={result.toolId} result={result} />
          ))}
      </div>

      {/* Lead capture / share */}
      <div className="card animate-fade-up animate-delay-400">
        {!leadCaptured ? (
          <div>
            <h3 className="font-display font-700 text-text-primary mb-1">
              Get this report by email
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              We&apos;ll send you a copy of this audit and notify you when new
              optimisations apply to your stack. No spam.
            </p>
            <button className="btn-primary w-full" onClick={onCaptureEmail}>
              Email me this report →
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="tag-green mx-auto mb-3 inline-flex">Email sent ✓</div>
            <p className="text-sm text-text-secondary">Check your inbox.</p>
          </div>
        )}

        <div className="border-t border-bg-border mt-5 pt-5">
          <p className="text-xs text-text-muted mb-3">Share this audit</p>
          <div className="flex gap-2 mb-3">
            <input
              readOnly
              value={shareUrl}
              className="field-input text-xs flex-1"
            />
            <button
              className="btn-secondary text-xs px-4"
              onClick={copyShare}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            className="btn-secondary text-xs w-full"
            onClick={async () => {
              const { exportAuditPDF } = await import("@/lib/export-pdf");
              exportAuditPDF(audit);
            }}
          >
            ↓ Export PDF
          </button>
        </div>
      </div>

      {/* Notify me (for optimal spend) */}
      {audit.isOptimal && !leadCaptured && (
        <div className="text-center mt-4">
          <button
            className="btn-secondary text-xs"
            onClick={onCaptureEmail}
          >
            Notify me when new optimisations apply →
          </button>
        </div>
      )}
    </div>
  );
}
