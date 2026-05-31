-- Short-lived pairing codes for BYDMate ↔ VoltFlow (6-digit redeem flow).

create table if not exists public.bydmate_link_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists bydmate_link_codes_code_hash_active_idx
  on public.bydmate_link_codes (code_hash)
  where redeemed_at is null;

create index if not exists bydmate_link_codes_user_id_idx
  on public.bydmate_link_codes (user_id);

create table if not exists public.bydmate_link_redeem_attempts (
  id bigserial primary key,
  ip_hash text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists bydmate_link_redeem_attempts_ip_hash_idx
  on public.bydmate_link_redeem_attempts (ip_hash, attempted_at);

alter table public.bydmate_link_codes enable row level security;
alter table public.bydmate_link_redeem_attempts enable row level security;

-- Service role only (API routes use createServiceClient).
