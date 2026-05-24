// app/api/audit/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAudit } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id || id.length > 20) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const audit = await getAudit(id);
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  // Strip PII for public view — email and company name not stored in audit,
  // they're stored separately in leads table. But be explicit.
  const { ...publicAudit } = audit;

  return NextResponse.json(publicAudit);
}
