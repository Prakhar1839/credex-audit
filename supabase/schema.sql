-- supabase/schema.sql
-- Run this in your Supabase SQL editor after creating the project.

create table if not exists audits (
  id text primary key,
  data jsonb not null,
  total_monthly_savings numeric,
  total_annual_savings numeric,
  team_size integer,
  use_case text,
  is_high_savings boolean,
  created_at timestamptz default now()
);

create table if not exists leads (
  id text primary key,
  audit_id text references audits(id),
  email text not null,
  company_name text,
  role text,
  team_size integer,
  created_at timestamptz default now()
);

-- Index for fast audit lookups
create index if not exists audits_created_at_idx on audits(created_at desc);
create index if not exists leads_audit_id_idx on leads(audit_id);

-- RLS: audits are public read, leads are service-role only
alter table audits enable row level security;
alter table leads enable row level security;

create policy "Audits are publicly readable"
  on audits for select using (true);

create policy "Audits are insertable by anyone"
  on audits for insert with check (true);

-- Leads: only service role (server-side) can read/write
create policy "Leads: service role only"
  on leads for all using (auth.role() = 'service_role');
