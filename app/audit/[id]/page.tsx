// app/audit/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAudit } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";
import AuditPage from "./AuditPage";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const audit = await getAudit(params.id);
  if (!audit) {
    return { title: "Audit not found — SpendScope" };
  }

  const savings = audit.totalMonthlySavings;
  const title =
    savings > 0
      ? `AI spend audit — ${formatCurrency(savings)}/mo in savings found`
      : "AI spend audit — spend is well-optimised";

  const description =
    savings > 0
      ? `This team could save ${formatCurrency(savings)}/month (${formatCurrency(audit.totalAnnualSavings)}/year) on AI tools. See the full breakdown.`
      : "This team's AI tool stack is well-calibrated. No material overspend found.";

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    `https://${process.env.VERCEL_URL ?? "localhost:3000"}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/audit/${params.id}`,
      type: "website",
      images: [
        {
          url: `/api/og?id=${params.id}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og?id=${params.id}`],
    },
  };
}

export default async function AuditResultPage({ params }: Props) {
  const audit = await getAudit(params.id);
  if (!audit) notFound();

  return <AuditPage audit={audit} auditId={params.id} />;
}
