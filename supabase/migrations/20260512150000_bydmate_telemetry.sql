-- BYDMate live telemetry ingestion.
-- Writes are performed by the Next.js API route with SUPABASE_SERVICE_ROLE_KEY.

alter table public.profiles
add column if not exists bydmate_cloud_api_key text unique;

create table if not exists public.bydmate_live_snapshots (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null default 'BYDMate',
  schema_version integer not null default 1,
  device_time timestamptz not null,
  received_at timestamptz not null default now(),
  telemetry jsonb not null default '{}'::jsonb,
  location jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint bydmate_live_snapshots_user_vehicle_unique unique (user_id, vehicle_id)
);

create table if not exists public.bydmate_telemetry_points (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null default 'BYDMate',
  schema_version integer not null default 1,
  device_time timestamptz not null,
  received_at timestamptz not null default now(),
  telemetry jsonb not null default '{}'::jsonb,
  location jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb
);

create index if not exists bydmate_telemetry_points_vehicle_time_idx
  on public.bydmate_telemetry_points (vehicle_id, device_time desc);

create index if not exists bydmate_telemetry_points_user_time_idx
  on public.bydmate_telemetry_points (user_id, device_time desc);

drop trigger if exists set_bydmate_live_snapshots_updated_at on public.bydmate_live_snapshots;
create trigger set_bydmate_live_snapshots_updated_at
before update on public.bydmate_live_snapshots
for each row execute procedure public.set_updated_at();

alter table public.bydmate_live_snapshots enable row level security;
alter table public.bydmate_telemetry_points enable row level security;

drop policy if exists "bydmate_live_snapshots_select_own" on public.bydmate_live_snapshots;
create policy "bydmate_live_snapshots_select_own"
  on public.bydmate_live_snapshots for select
  using (auth.uid() = user_id);

drop policy if exists "bydmate_telemetry_points_select_own" on public.bydmate_telemetry_points;
create policy "bydmate_telemetry_points_select_own"
  on public.bydmate_telemetry_points for select
  using (auth.uid() = user_id);
