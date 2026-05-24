"use client";
// app/audit/[id]/AuditPage.tsx

import { useState } from "react";
import AuditResults from "@/components/AuditResults";
import LeadCapture from "@/components/LeadCapture";
import type { AuditResult } from "@/lib/audit-engine";
import { getBaseUrl } from "@/lib/utils";
import Link from "next/link";

interface Props {
  audit: AuditResult & { id: string };
  auditId: string;
}

export default function AuditPage({ audit, auditId }: Props) {
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/audit/${auditId}`;

  return (
    <main className="min-h-screen grid-bg">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Nav */}
        <nav className="flex items-center justify-between mb-14">
          <Link
            href="/"
            className="font-display font-700 text-text-primary tracking-tight hover:text-brand-green transition-colors"
          >
            Spend<span className="text-brand-green">Scope</span>
          </Link>
          <Link
            href="/"
            className="text-xs text-text-muted hover:text-text-primary transition-colors border border-bg-border px-3 py-1.5 rounded-full"
          >
            ← Run new audit
          </Link>
        </nav>

        <AuditResults
          audit={audit}
          shareUrl={shareUrl}
          onCaptureEmail={() => setShowLeadCapture(true)}
          leadCaptured={leadCaptured}
        />

        {showLeadCapture && (
          <LeadCapture
            auditId={auditId}
            onSuccess={() => {
              setLeadCaptured(true);
              setShowLeadCapture(false);
            }}
            onClose={() => setShowLeadCapture(false)}
          />
        )}

        <footer className="mt-16 text-center text-text-muted text-xs">
          <p>
            SpendScope by{" "}
            <a
              href="https://credex.rocks"
              className="text-text-secondary hover:text-brand-green transition-colors"
            >
              Credex
            </a>
            . Pricing verified weekly — always check vendor pages before making decisions.
          </p>
        </footer>
      </div>
    </main>
  );
}
