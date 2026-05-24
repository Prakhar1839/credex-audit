// app/api/lead/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveLead } from "@/lib/storage";
import { sendAuditConfirmationEmail } from "@/lib/email";
import { getAudit } from "@/lib/storage";
import { getBaseUrl } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot
  if (body.website || body.phone_number) {
    return NextResponse.json({ ok: true });
  }

  const { auditId, email, companyName, role, teamSize } = body as {
    auditId?: string;
    email?: string;
    companyName?: string;
    role?: string;
    teamSize?: number;
  };

  if (!auditId || !email) {
    return NextResponse.json(
      { error: "auditId and email are required" },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Get audit data for email content
  const audit = await getAudit(auditId);
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  try {
    await saveLead({
      auditId,
      email,
      companyName: typeof companyName === "string" ? companyName : undefined,
      role: typeof role === "string" ? role : undefined,
      teamSize: typeof teamSize === "number" ? teamSize : undefined,
    });

    const shareUrl = `${getBaseUrl()}/audit/${auditId}`;

    await sendAuditConfirmationEmail({
      to: email,
      auditId,
      totalMonthlySavings: audit.totalMonthlySavings,
      totalAnnualSavings: audit.totalAnnualSavings,
      isHighSavings: audit.isHighSavings,
      shareUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/lead] Error:", err);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
