-- ============================================================
-- Migration v3 — Run in Supabase SQL Editor
-- Adds: email_flags (prevents duplicate quota warning emails)
-- ============================================================

create table if not exists public.email_flags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  flag       text not null,
  created_at timestamptz default now()
);

-- Index for fast monthly lookups
create index if not exists email_flags_user_flag_idx
  on public.email_flags(user_id, flag, created_at);

alter table public.email_flags enable row level security;

create policy "Service role full access on email_flags"
  on public.email_flags for all
  using (auth.role() = 'service_role');

-- Also add email column to user_plans if not present
-- (stores the email from Paystack for sending notifications)
alter table public.user_plans
  add column if not exists email text;

-- ============================================================
-- Verify:
-- select table_name from information_schema.tables
-- where table_schema = 'public' order by table_name;
-- Expected: api_keys, email_flags, idempotency_keys, user_plans
-- ============================================================
