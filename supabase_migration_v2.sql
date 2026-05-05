-- ============================================================
-- Migration v2 — Run in Supabase SQL Editor
-- Adds: api_keys, idempotency_keys, increment RPC
-- ============================================================

-- ── Table: api_keys ────────────────────────────────────────
create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  key_hash     text not null unique,
  key_prefix   text not null,
  is_active    boolean not null default true,
  created_at   timestamptz default now(),
  last_used_at timestamptz
);

alter table public.api_keys enable row level security;

-- Users can read and manage their own keys
create policy "Users manage own API keys"
  on public.api_keys for all
  using (auth.uid() = user_id);

-- Service role full access (for webhook and middleware)
create policy "Service role full access on api_keys"
  on public.api_keys for all
  using (auth.role() = 'service_role');

create index if not exists api_keys_key_hash_idx on public.api_keys(key_hash);
create index if not exists api_keys_user_id_idx  on public.api_keys(user_id);


-- ── Table: idempotency_keys ────────────────────────────────
create table if not exists public.idempotency_keys (
  key           text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  response_body text not null,
  created_at    timestamptz default now()
);

alter table public.idempotency_keys enable row level security;

create policy "Service role full access on idempotency_keys"
  on public.idempotency_keys for all
  using (auth.role() = 'service_role');

-- Auto-cleanup: delete idempotency keys older than 24 hours
-- (Supabase cron job — enable in Dashboard → Database → Hooks)
-- delete from public.idempotency_keys where created_at < now() - interval '24 hours';


-- ── RPC: increment_requests_used ──────────────────────────
-- Atomic increment — safe under concurrent requests
create or replace function public.increment_requests_used(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Insert free plan row if not exists, then increment
  insert into public.user_plans (user_id, plan, requests_limit, requests_used)
  values (p_user_id, 'free', 50, 1)
  on conflict (user_id) do update
    set requests_used = public.user_plans.requests_used + 1,
        updated_at    = now();
end;
$$;

-- Grant execute to service role
grant execute on function public.increment_requests_used(uuid) to service_role;


-- ── Verify everything ──────────────────────────────────────
-- select table_name from information_schema.tables
-- where table_schema = 'public'
-- order by table_name;
-- Expected: api_keys, idempotency_keys, user_plans
