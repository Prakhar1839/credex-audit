// app/api/og/route.tsx
// Generates a dynamic Open Graph image for each audit result.
// Uses the Next.js ImageResponse API (no external dependencies).

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getAudit } from "@/lib/storage";

export const runtime = "nodejs";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  let monthlySavings = 0;
  let annualSavings = 0;
  let toolCount = 0;
  let isOptimal = false;

  if (id) {
    try {
      const audit = await getAudit(id);
      if (audit) {
        monthlySavings = audit.totalMonthlySavings;
        annualSavings = audit.totalAnnualSavings;
        toolCount = audit.results.length;
        isOptimal = audit.isOptimal;
      }
    } catch {
      // use defaults
    }
  }

  const headline =
    monthlySavings > 0
      ? `${formatCurrency(monthlySavings)}/mo in savings found`
      : isOptimal
      ? "AI spend is well-optimised"
      : "AI Spend Audit";

  const subline =
    monthlySavings > 0
      ? `${formatCurrency(annualSavings)} per year · ${toolCount} tool${toolCount !== 1 ? "s" : ""} audited`
      : "Free AI tool cost audit by Credex";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#08080E",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(30,30,48,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,48,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: "rgba(0,232,122,0.1)",
              border: "1px solid rgba(0,232,122,0.3)",
              borderRadius: 100,
              padding: "8px 20px",
              color: "#00E87A",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            SpendScope by Credex
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {monthlySavings > 0 && (
            <div
              style={{
                color: "#00E87A",
                fontSize: 100,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-2px",
              }}
            >
              {formatCurrency(monthlySavings)}
            </div>
          )}
          <div
            style={{
              color: "#EEEEF5",
              fontSize: monthlySavings > 0 ? 36 : 64,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {headline}
          </div>
          <div style={{ color: "#8888A8", fontSize: 24 }}>{subline}</div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#55556A",
            fontSize: 18,
          }}
        >
          <span>spendscope.credex.rocks</span>
          <span>Free · No signup · 2 minutes</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
