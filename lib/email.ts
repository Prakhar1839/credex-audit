// lib/email.ts
// Sends transactional emails via Resend. Falls back to console.log in dev.

import type { StoredAudit } from "./storage";

interface AuditEmailPayload {
  to: string;
  auditId: string;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  isHighSavings: boolean;
  shareUrl: string;
}

export async function sendAuditConfirmationEmail(
  payload: AuditEmailPayload
): Promise<void> {
  const { to, auditId, totalMonthlySavings, totalAnnualSavings, isHighSavings, shareUrl } = payload;

  const subject =
    totalMonthlySavings > 0
      ? `Your AI spend audit — $${totalMonthlySavings.toLocaleString()}/month in savings found`
      : "Your AI spend audit is ready";

  const savingsBlock =
    totalMonthlySavings > 0
      ? `<p>We found <strong>$${totalMonthlySavings.toLocaleString()}/month</strong> ($${totalAnnualSavings.toLocaleString()}/year) in potential savings in your AI tool stack.</p>`
      : `<p>Your AI stack looks well-calibrated — no material overspend found. We'll notify you if new optimisations apply.</p>`;

  const credexBlock = isHighSavings
    ? `<p style="background:#00E87A22;border:1px solid #00E87A44;border-radius:8px;padding:16px;color:#00E87A">
        <strong>High-savings alert:</strong> With $${totalMonthlySavings.toLocaleString()}/month identified, 
        Credex can help you capture even more through discounted AI infrastructure credits. 
        A Credex advisor will be in touch shortly.
      </p>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:'DM Sans',Arial,sans-serif;background:#08080E;color:#EEEEF5;max-width:600px;margin:0 auto;padding:32px 24px">
  <img src="https://spendscope.credex.rocks/logo.png" alt="SpendScope" style="height:32px;margin-bottom:32px" />
  <h1 style="font-size:24px;font-weight:700;margin:0 0 16px">Your AI Spend Audit</h1>
  ${savingsBlock}
  ${credexBlock}
  <p style="margin:24px 0">
    <a href="${shareUrl}" style="background:#00E87A;color:#08080E;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;display:inline-block">
      View Your Full Report →
    </a>
  </p>
  <p style="color:#8888A8;font-size:13px">
    This report is also accessible at: <a href="${shareUrl}" style="color:#00E87A">${shareUrl}</a>
  </p>
  <hr style="border:none;border-top:1px solid #1E1E30;margin:32px 0" />
  <p style="color:#55556A;font-size:12px">
    SpendScope is a free tool by <a href="https://credex.rocks" style="color:#8888A8">Credex</a> — discounted AI infrastructure credits.
    You're receiving this because you completed an audit at spendscope.credex.rocks.
  </p>
</body>
</html>`;

  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.log("[email] No RESEND_API_KEY. Would have sent email:");
    console.log("  To:", to);
    console.log("  Subject:", subject);
    console.log("  Savings:", `$${totalMonthlySavings}/mo`);
    return;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const { error } = await resend.emails.send({
      from: "SpendScope <audit@spendscope.credex.rocks>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}
