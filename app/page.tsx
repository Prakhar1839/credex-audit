"use client";
// app/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import SpendForm from "@/components/SpendForm";
import type { AuditInput } from "@/lib/audit-engine";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAudit(input: AuditInput) {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const data = await res.json();
      router.push(`/audit/${data.id}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid-bg">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        {/* Nav */}
        <nav className="flex items-center justify-between mb-16">
          <div className="font-display font-700 text-text-primary tracking-tight">
            Spend<span className="text-brand-green">Scope</span>
          </div>
          <a
            href="https://credex.rocks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-text-primary transition-colors border border-bg-border px-3 py-1.5 rounded-full"
          >
            by Credex →
          </a>
        </nav>

        {/* Hero */}
        <div className="text-center mb-14 animate-fade-up">
          <div className="tag-green mb-6 mx-auto inline-flex">
            Free · No signup · 2 minutes
          </div>
          <h1 className="font-display font-800 text-4xl sm:text-6xl text-text-primary leading-none mb-5">
            Are you overspending
            <br />
            on <span className="text-brand-green">AI tools?</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto leading-relaxed">
            Most startups overpay by $200–800/month. Enter your stack and get an
            instant audit with specific savings recommendations.
          </p>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 mb-14 animate-fade-up animate-delay-100">
          <div className="text-center">
            <div className="font-mono font-500 text-brand-green text-xl">$340</div>
            <div className="text-text-muted text-xs">avg. monthly savings</div>
          </div>
          <div className="h-8 w-px bg-bg-border" />
          <div className="text-center">
            <div className="font-mono font-500 text-brand-green text-xl">2 min</div>
            <div className="text-text-muted text-xs">to complete audit</div>
          </div>
          <div className="h-8 w-px bg-bg-border" />
          <div className="text-center">
            <div className="font-mono font-500 text-brand-green text-xl">8 tools</div>
            <div className="text-text-muted text-xs">supported</div>
          </div>
        </div>

        {/* Form */}
        <div className="animate-fade-up animate-delay-200">
          <SpendForm onComplete={handleAudit} isLoading={isLoading} />
        </div>

        {error && (
          <div className="mt-6 bg-brand-red/10 border border-brand-red/30 rounded-lg p-4 text-center">
            <p className="text-brand-red text-sm">{error}</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-24 text-center text-text-muted text-xs">
          <p>
            SpendScope is a free tool by{" "}
            <a
              href="https://credex.rocks"
              className="text-text-secondary hover:text-brand-green transition-colors"
            >
              Credex
            </a>{" "}
            — discounted AI infrastructure credits for startups.
          </p>
          <p className="mt-1">
            Pricing data is verified weekly. Numbers are estimates; verify with your vendor.
          </p>
        </footer>
      </div>
    </main>
  );
}
