// lib/export-pdf.ts
// Generates a PDF of the audit result using the browser's native print API.
// No external library needed — produces a clean printable version.

import type { AuditResult } from "./audit-engine";
import { formatCurrency } from "./utils";

export function exportAuditPDF(audit: AuditResult & { id: string }) {
  const { results, totalMonthlySavings, totalAnnualSavings, input } = audit;

  const rows = [...results]
    .sort((a, b) => b.monthlySavings - a.monthlySavings)
    .map(
      (r) => `
      <tr>
        <td>${r.toolName}</td>
        <td>${r.currentPlanLabel}</td>
        <td>${formatCurrency(r.currentMonthlySpend)}/mo</td>
        <td>${r.monthlySavings > 0 ? `<span class="savings">-${formatCurrency(r.monthlySavings)}/mo</span>` : '<span class="optimal">Optimal</span>'}</td>
        <td class="reason">${r.reason}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SpendScope Audit — ${new Date().toLocaleDateString()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; padding: 48px; font-size: 13px; line-height: 1.5; }
    h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
    .meta { color: #666; margin-bottom: 32px; }
    .hero { display: flex; gap: 32px; margin-bottom: 32px; padding: 20px; background: #f5f5f5; border-radius: 8px; }
    .hero-item { }
    .hero-label { font-size: 11px; text-transform: uppercase; color: #888; }
    .hero-value { font-size: 28px; font-weight: 800; color: #00a855; }
    .hero-sub { font-size: 13px; color: #444; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #888; border-bottom: 2px solid #eee; }
    td { padding: 10px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
    td.reason { font-size: 11px; color: #555; max-width: 300px; }
    .savings { color: #00a855; font-weight: 700; }
    .optimal { color: #888; }
    .summary { margin-top: 32px; padding: 20px; background: #f9f9f9; border-radius: 8px; }
    .summary h2 { font-size: 14px; margin-bottom: 8px; }
    .summary p { font-size: 12px; color: #444; }
    .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #aaa; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <h1>SpendScope — AI Spend Audit</h1>
  <p class="meta">
    Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} ·
    Team size: ${input.teamSize} · Use case: ${input.primaryUseCase}
  </p>

  <div class="hero">
    <div class="hero-item">
      <div class="hero-label">Monthly savings</div>
      <div class="hero-value">${totalMonthlySavings > 0 ? formatCurrency(totalMonthlySavings) : "Optimal"}</div>
      <div class="hero-sub">${totalMonthlySavings > 0 ? "identified" : "No material overspend"}</div>
    </div>
    ${totalMonthlySavings > 0 ? `
    <div class="hero-item">
      <div class="hero-label">Annual savings</div>
      <div class="hero-value">${formatCurrency(totalAnnualSavings)}</div>
      <div class="hero-sub">over 12 months</div>
    </div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>Tool</th>
        <th>Current plan</th>
        <th>Monthly spend</th>
        <th>Savings</th>
        <th>Recommendation</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  ${audit.aiSummary ? `
  <div class="summary">
    <h2>Summary</h2>
    <p>${audit.aiSummary}</p>
  </div>` : ""}

  <div class="footer">
    SpendScope by Credex (credex.rocks) · spendscope.credex.rocks/audit/${audit.id}
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 300);
}
