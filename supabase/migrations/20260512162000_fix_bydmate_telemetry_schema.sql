-- Idempotent repair for databases that ran an earlier BYDMate telemetry draft.

alter table public.profiles
add column if not exists bydmate_cloud_api_key text unique;

alter table public.bydmate_live_snapshots
add column if not exists id uuid default gen_random_uuid();

alter table public.bydmate_live_snapshots
add column if not exists user_id uuid references auth.users (id) on delete cascade;

delete from public.bydmate_live_snapshots where user_id is null;

update public.bydmate_live_snapshots
set id = gen_random_uuid()
where id is null;

alter table public.bydmate_live_snapshots
alter column id set not null;

alter table public.bydmate_live_snapshots
alter column user_id set not null;

alter table public.bydmate_live_snapshots
drop constraint if exists bydmate_live_snapshots_pkey;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bydmate_live_snapshots_pkey'
      and conrelid = 'public.bydmate_live_snapshots'::regclass
  ) then
    alter table public.bydmate_live_snapshots
    add constraint bydmate_live_snapshots_pkey primary key (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bydmate_live_snapshots_user_vehicle_unique'
      and conrelid = 'public.bydmate_live_snapshots'::regclass
  ) then
    alter table public.bydmate_live_snapshots
    add constraint bydmate_live_snapshots_user_vehicle_unique unique (user_id, vehicle_id);
  end if;
end $$;

alter table public.bydmate_telemetry_points
add column if not exists user_id uuid references auth.users (id) on delete cascade;

delete from public.bydmate_telemetry_points where user_id is null;

alter table public.bydmate_telemetry_points
alter column user_id set not null;

create index if not exists bydmate_telemetry_points_user_time_idx
  on public.bydmate_telemetry_points (user_id, device_time desc);

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
