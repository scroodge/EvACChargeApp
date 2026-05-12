-- BYDMate live telemetry ingestion.
-- Writes are performed by the Next.js API route with SUPABASE_SERVICE_ROLE_KEY.

create table if not exists public.bydmate_live_snapshots (
  vehicle_id text primary key,
  source text not null default 'BYDMate',
  schema_version integer not null default 1,
  device_time timestamptz not null,
  received_at timestamptz not null default now(),
  telemetry jsonb not null default '{}'::jsonb,
  location jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.bydmate_telemetry_points (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null,
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

drop trigger if exists set_bydmate_live_snapshots_updated_at on public.bydmate_live_snapshots;
create trigger set_bydmate_live_snapshots_updated_at
before update on public.bydmate_live_snapshots
for each row execute procedure public.set_updated_at();

alter table public.bydmate_live_snapshots enable row level security;
alter table public.bydmate_telemetry_points enable row level security;
