// lib/storage.ts
// Adapter pattern: uses Supabase if env vars are set, otherwise stores to a
// local JSON file (dev/demo mode). Works out of the box without any account.

import type { AuditResult } from "./audit-engine";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoredAudit extends AuditResult {
  id: string;
  createdAt: string;
}

export interface LeadRecord {
  id: string;
  auditId: string;
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: number;
  createdAt: string;
}

// ─── Local file store (dev/demo) ─────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), ".data");
const AUDITS_FILE = path.join(DATA_DIR, "audits.json");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON<T>(filePath: string): T[] {
  ensureDataDir();
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

function writeJSON<T>(filePath: string, data: T[]) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ─── Supabase store ───────────────────────────────────────────────────────────

async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function saveAudit(audit: AuditResult): Promise<StoredAudit> {
  const id = nanoid(10);
  const stored: StoredAudit = {
    ...audit,
    id,
    createdAt: new Date().toISOString(),
  };

  const supabase = await getSupabase();

  if (supabase) {
    const { error } = await supabase.from("audits").insert({
      id,
      data: stored,
      total_monthly_savings: stored.totalMonthlySavings,
      total_annual_savings: stored.totalAnnualSavings,
      team_size: stored.input.teamSize,
      use_case: stored.input.primaryUseCase,
      is_high_savings: stored.isHighSavings,
      created_at: stored.createdAt,
    });
    if (error) {
      console.error("[storage] Supabase insert error:", error);
      // fall through to local
    } else {
      return stored;
    }
  }

  // Local fallback
  const audits = readJSON<StoredAudit>(AUDITS_FILE);
  audits.push(stored);
  writeJSON(AUDITS_FILE, audits);
  return stored;
}

export async function getAudit(id: string): Promise<StoredAudit | null> {
  const supabase = await getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("audits")
      .select("data")
      .eq("id", id)
      .single();
    if (error || !data) {
      console.warn("[storage] Supabase read miss, falling back to local:", error?.message);
    } else {
      return data.data as StoredAudit;
    }
  }

  // Local fallback
  const audits = readJSON<StoredAudit>(AUDITS_FILE);
  return audits.find((a) => a.id === id) ?? null;
}

export async function saveLead(lead: Omit<LeadRecord, "id" | "createdAt">): Promise<LeadRecord> {
  const record: LeadRecord = {
    ...lead,
    id: nanoid(10),
    createdAt: new Date().toISOString(),
  };

  const supabase = await getSupabase();

  if (supabase) {
    const { error } = await supabase.from("leads").insert({
      id: record.id,
      audit_id: record.auditId,
      email: record.email,
      company_name: record.companyName,
      role: record.role,
      team_size: record.teamSize,
      created_at: record.createdAt,
    });
    if (error) {
      console.error("[storage] Supabase lead insert error:", error);
    } else {
      return record;
    }
  }

  // Local fallback
  const leads = readJSON<LeadRecord>(LEADS_FILE);
  leads.push(record);
  writeJSON(LEADS_FILE, leads);
  return record;
}
