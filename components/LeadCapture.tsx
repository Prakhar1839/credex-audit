"use client";
// components/LeadCapture.tsx

import { useState } from "react";

interface Props {
  auditId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function LeadCapture({ auditId, onSuccess, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Honeypot
  const [honeypot, setHoneypot] = useState("");

  async function handleSubmit() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          email,
          companyName: company || undefined,
          role: role || undefined,
          website: honeypot || undefined, // honeypot — server will silently reject if filled
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
      } else {
        onSuccess();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(8,8,14,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div className="card max-w-md w-full relative animate-fade-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="font-display font-700 text-lg text-text-primary mb-1">
          Get your report by email
        </h3>
        <p className="text-sm text-text-secondary mb-6">
          We&apos;ll send you this audit and flag new savings as AI tool pricing changes.
        </p>

        <div className="space-y-4">
          {/* Honeypot — hidden from real users */}
          <div className="absolute -top-[9999px] -left-[9999px] opacity-0" aria-hidden="true">
            <input
              tabIndex={-1}
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              autoComplete="off"
              name="website"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">
              Work email <span className="text-brand-red">*</span>
            </label>
            <input
              type="email"
              className="field-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Company</label>
              <input
                type="text"
                className="field-input"
                placeholder="Acme Inc"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Your role</label>
              <input
                type="text"
                className="field-input"
                placeholder="CTO"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-brand-red text-sm">{error}</p>
          )}

          <button
            className="btn-primary w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send report →"}
          </button>

          <p className="text-xs text-text-muted text-center">
            No spam. Unsubscribe at any time. We never sell your data.
          </p>
        </div>
      </div>
    </div>
  );
}
