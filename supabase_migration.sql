-- ============================================================
-- Run this ONCE in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste → Run
-- ============================================================

-- Table: user_plans
-- Stores plan info for each user after Paystack payment
create table if not exists public.user_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  plan            text not null default 'free',
  requests_limit  integer not null default 50,
  requests_used   integer not null default 0,
  payment_ref     text,
  email           text,
  activated_at    timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  constraint user_plans_user_id_key unique (user_id)
);

-- Auto-update updated_at on every change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_plans_updated_at
  before update on public.user_plans
  for each row execute function update_updated_at();

-- Row Level Security: users can only read their own plan
alter table public.user_plans enable row level security;

create policy "Users can view own plan"
  on public.user_plans for select
  using (auth.uid() = user_id);

-- Service role (used by webhook) can do everything
create policy "Service role full access"
  on public.user_plans for all
  using (auth.role() = 'service_role');

-- ============================================================
-- Verify it worked:
-- select * from public.user_plans;
-- ============================================================
