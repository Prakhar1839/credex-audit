"use client";
// components/SpendForm.tsx
// Multi-step spend input form. State persists in localStorage across reloads.

import { useState, useEffect } from "react";
import { TOOLS, TOOL_ORDER, type ToolId, type UseCase } from "@/lib/pricing-data";
import type { AuditInput, ToolEntry } from "@/lib/audit-engine";

const STORAGE_KEY = "spendscope_form_v1";

const USE_CASES: { value: UseCase; label: string; description: string }[] = [
  { value: "coding", label: "Coding & Dev", description: "Writing, reviewing, or debugging code" },
  { value: "writing", label: "Writing & Content", description: "Docs, emails, marketing copy" },
  { value: "data", label: "Data & Analysis", description: "SQL, spreadsheets, research synthesis" },
  { value: "research", label: "Research", description: "Information gathering, summarisation" },
  { value: "mixed", label: "Mixed", description: "Multiple use cases across the team" },
];

interface ToolFormState {
  enabled: boolean;
  planId: string;
  monthlySpend: string;
  seats: string;
}

type FormState = {
  teamSize: string;
  primaryUseCase: UseCase;
  tools: Partial<Record<ToolId, ToolFormState>>;
};

const defaultState: FormState = {
  teamSize: "",
  primaryUseCase: "mixed",
  tools: {},
};

interface Props {
  onComplete: (input: AuditInput) => void;
  isLoading: boolean;
}

export default function SpendForm({ onComplete, isLoading }: Props) {
  const [form, setForm] = useState<FormState>(defaultState);
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<string[]>([]);

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setForm(JSON.parse(saved));
    } catch {}
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  function setToolField(toolId: ToolId, field: keyof ToolFormState, value: string | boolean) {
    setForm((f) => ({
      ...f,
      tools: {
        ...f.tools,
        [toolId]: {
          enabled: false,
          planId: TOOLS[toolId].plans[0].id,
          monthlySpend: "",
          seats: "1",
          ...(f.tools[toolId] ?? {}),
          [field]: value,
        },
      },
    }));
  }

  function validate(): boolean {
    const errs: string[] = [];
    const teamSize = parseInt(form.teamSize, 10);
    if (!teamSize || teamSize < 1 || teamSize > 10000) {
      errs.push("Enter a valid team size (1–10,000).");
    }

    const enabledTools = TOOL_ORDER.filter((id) => form.tools[id]?.enabled);
    if (enabledTools.length === 0) {
      errs.push("Select at least one AI tool your team pays for.");
    }

    for (const id of enabledTools) {
      const t = form.tools[id]!;
      const spend = parseFloat(t.monthlySpend);
      const seats = parseInt(t.seats, 10);
      if (isNaN(spend) || spend < 0) {
        errs.push(`${TOOLS[id].name}: enter a valid monthly spend.`);
      }
      if (isNaN(seats) || seats < 1) {
        errs.push(`${TOOLS[id].name}: enter a valid seat count.`);
      }
    }

    setErrors(errs);
    return errs.length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const enabledTools = TOOL_ORDER.filter((id) => form.tools[id]?.enabled);
    const tools: ToolEntry[] = enabledTools.map((id) => ({
      toolId: id,
      planId: form.tools[id]!.planId,
      monthlySpend: parseFloat(form.tools[id]!.monthlySpend) || 0,
      seats: parseInt(form.tools[id]!.seats, 10) || 1,
    }));

    onComplete({
      tools,
      teamSize: parseInt(form.teamSize, 10),
      primaryUseCase: form.primaryUseCase,
    });
  }

  const enabledCount = TOOL_ORDER.filter((id) => form.tools[id]?.enabled).length;

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Step header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setStep(1)}
          className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
            step === 1
              ? "border-brand-green text-brand-green bg-brand-green/10"
              : "border-bg-border text-text-muted"
          }`}
        >
          01 · Team
        </button>
        <div className="h-px w-8 bg-bg-border" />
        <button
          onClick={() => {
            if (!form.teamSize) return;
            setStep(2);
          }}
          className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
            step === 2
              ? "border-brand-green text-brand-green bg-brand-green/10"
              : "border-bg-border text-text-muted"
          }`}
        >
          02 · Tools
        </button>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-fade-up">
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Team size (people who use AI tools)
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              className="field-input"
              placeholder="e.g. 8"
              value={form.teamSize}
              onChange={(e) => setForm((f) => ({ ...f, teamSize: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-3">
              Primary use case
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {USE_CASES.map((uc) => (
                <button
                  key={uc.value}
                  onClick={() =>
                    setForm((f) => ({ ...f, primaryUseCase: uc.value }))
                  }
                  className={`text-left p-4 rounded-lg border transition-all ${
                    form.primaryUseCase === uc.value
                      ? "border-brand-green bg-brand-green/5 text-text-primary"
                      : "border-bg-border text-text-secondary hover:border-bg-border/80"
                  }`}
                >
                  <div className="font-display font-600 text-sm">{uc.label}</div>
                  <div className="text-xs text-text-muted mt-0.5">{uc.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-primary w-full"
            onClick={() => {
              if (!form.teamSize || parseInt(form.teamSize) < 1) {
                setErrors(["Enter your team size to continue."]);
                return;
              }
              setErrors([]);
              setStep(2);
            }}
          >
            Next — Add your tools →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-up">
          <p className="text-sm text-text-secondary mb-6">
            Check every AI tool your team pays for. Add your current plan and monthly spend.
          </p>

          <div className="space-y-3 mb-8">
            {TOOL_ORDER.map((toolId) => {
              const tool = TOOLS[toolId];
              const entry = form.tools[toolId];
              const isEnabled = entry?.enabled ?? false;
              const selectedPlan = tool.plans.find((p) => p.id === (entry?.planId ?? tool.plans[0].id));

              return (
                <div
                  key={toolId}
                  className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                    isEnabled
                      ? "border-brand-green/30 bg-brand-green/[0.03]"
                      : "border-bg-border bg-bg-surface"
                  }`}
                >
                  {/* Tool header */}
                  <button
                    className="w-full flex items-center gap-4 p-4 text-left"
                    onClick={() => setToolField(toolId, "enabled", !isEnabled)}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isEnabled
                          ? "border-brand-green bg-brand-green"
                          : "border-bg-border"
                      }`}
                    >
                      {isEnabled && (
                        <svg className="w-3 h-3 text-bg-base" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-display font-600 text-sm text-text-primary">
                        {tool.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {tool.category === "api" ? "Usage-based API" : tool.category === "coding" ? "Code assistant" : "LLM chat"}
                      </div>
                    </div>
                  </button>

                  {/* Tool details */}
                  {isEnabled && (
                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-bg-border pt-4">
                      {/* Plan */}
                      <div>
                        <label className="text-xs text-text-muted mb-1.5 block">Plan</label>
                        <div className="relative">
                          <select
                            className="field-select pr-8 text-xs"
                            value={entry?.planId ?? tool.plans[0].id}
                            onChange={(e) => setToolField(toolId, "planId", e.target.value)}
                          >
                            {tool.plans.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label}
                                {p.isCustom ? " (Custom)" : ""}
                                {p.isUsageBased ? " (Pay-per-use)" : ""}
                              </option>
                            ))}
                          </select>
                          <svg className="absolute right-2 top-3 w-3 h-3 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {selectedPlan && !selectedPlan.isCustom && !selectedPlan.isUsageBased && selectedPlan.pricePerSeat > 0 && (
                          <p className="text-xs text-text-muted mt-1">
                            List price: ${selectedPlan.pricePerSeat}/seat/mo
                          </p>
                        )}
                      </div>

                      {/* Monthly spend */}
                      <div>
                        <label className="text-xs text-text-muted mb-1.5 block">
                          Monthly spend (USD)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-text-muted text-sm">$</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="field-input pl-7 text-xs"
                            placeholder="0"
                            value={entry?.monthlySpend ?? ""}
                            onChange={(e) =>
                              setToolField(toolId, "monthlySpend", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      {/* Seats */}
                      {!selectedPlan?.isUsageBased && (
                        <div>
                          <label className="text-xs text-text-muted mb-1.5 block">Seats / users</label>
                          <input
                            type="number"
                            min="1"
                            className="field-input text-xs"
                            placeholder="1"
                            value={entry?.seats ?? ""}
                            onChange={(e) =>
                              setToolField(toolId, "seats", e.target.value)
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {errors.length > 0 && (
            <div className="bg-brand-red/10 border border-brand-red/30 rounded-lg p-4 mb-6">
              {errors.map((e) => (
                <p key={e} className="text-brand-red text-sm">
                  {e}
                </p>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button className="btn-secondary" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={isLoading || enabledCount === 0}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analysing your stack...
                </>
              ) : (
                `Run Audit${enabledCount > 0 ? ` (${enabledCount} tool${enabledCount > 1 ? "s" : ""})` : ""} →`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
