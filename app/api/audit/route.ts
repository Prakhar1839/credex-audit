// app/api/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runAudit, type AuditInput } from "@/lib/audit-engine";
import { generateAiSummary } from "@/lib/ai-summary";
import { saveAudit } from "@/lib/storage";

// Simple in-memory rate limit (resets on deploy — good enough for MVP)
const ipCounts = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now > entry.reset) {
    ipCounts.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many audits. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate
  const input = body as AuditInput;
  if (
    !input ||
    !Array.isArray(input.tools) ||
    input.tools.length === 0 ||
    !input.teamSize ||
    !input.primaryUseCase
  ) {
    return NextResponse.json(
      { error: "Missing required fields: tools, teamSize, primaryUseCase" },
      { status: 400 }
    );
  }

  // Honeypot — if "website" field is present in body, it's a bot
  if ((body as Record<string, unknown>).website) {
    return NextResponse.json({ ok: true }); // silent reject
  }

  try {
    // Run audit engine (deterministic, no AI)
    const auditResult = runAudit(input);

    // Generate AI summary (with fallback)
    const aiSummary = await generateAiSummary(auditResult);
    auditResult.aiSummary = aiSummary;

    // Persist
    const stored = await saveAudit(auditResult);

    return NextResponse.json({ id: stored.id, audit: stored }, { status: 201 });
  } catch (err) {
    console.error("[api/audit] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
