-- EV Charge Timer — schema, RLS, Realtime, triggers
-- Run in Supabase SQL editor or via supabase db push

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (mirror of auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  battery_capacity_kwh numeric not null check (battery_capacity_kwh > 0),
  default_charger_power_kw numeric not null default 4.4 check (default_charger_power_kw > 0),
  default_efficiency_percent numeric not null default 90 check (default_efficiency_percent > 0 and default_efficiency_percent <= 100),
  created_at timestamptz not null default now()
);

create table if not exists public.charging_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  car_id uuid not null references public.cars (id) on delete cascade,
  start_percent numeric not null check (start_percent >= 0 and start_percent <= 100),
  current_percent numeric not null check (current_percent >= 0 and current_percent <= 100),
  target_percent numeric not null check (target_percent > 0 and target_percent <= 100),
  battery_capacity_kwh numeric not null check (battery_capacity_kwh > 0),
  charger_power_kw numeric not null check (charger_power_kw > 0),
  efficiency_percent numeric not null check (efficiency_percent > 0 and efficiency_percent <= 100),
  price_per_kwh numeric not null default 0 check (price_per_kwh >= 0),
  charged_energy_kwh numeric not null default 0 check (charged_energy_kwh >= 0),
  estimated_cost numeric not null default 0 check (estimated_cost >= 0),
  status text not null default 'idle' check (status in ('idle', 'charging', 'completed', 'stopped')),
  started_at timestamptz,
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint charging_sessions_percent_order check (start_percent < target_percent)
);

create index if not exists cars_user_id_idx on public.cars (user_id);
create index if not exists charging_sessions_user_id_idx on public.charging_sessions (user_id);
create index if not exists charging_sessions_user_status_idx on public.charging_sessions (user_id, status);
create index if not exists charging_sessions_car_id_idx on public.charging_sessions (car_id);

-- updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_charging_sessions_updated_at on public.charging_sessions;
create trigger set_charging_sessions_updated_at
before update on public.charging_sessions
for each row execute procedure public.set_updated_at();

-- New user → profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.cars enable row level security;
alter table public.charging_sessions enable row level security;

-- Profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Cars
create policy "cars_select_own"
  on public.cars for select
  using (auth.uid() = user_id);

create policy "cars_insert_own"
  on public.cars for insert
  with check (auth.uid() = user_id);

create policy "cars_update_own"
  on public.cars for update
  using (auth.uid() = user_id);

create policy "cars_delete_own"
  on public.cars for delete
  using (auth.uid() = user_id);

-- Charging sessions
create policy "sessions_select_own"
  on public.charging_sessions for select
  using (auth.uid() = user_id);

create policy "sessions_insert_own"
  on public.charging_sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions_update_own"
  on public.charging_sessions for update
  using (auth.uid() = user_id);

create policy "sessions_delete_own"
  on public.charging_sessions for delete
  using (auth.uid() = user_id);

-- Realtime: replicate charging_sessions
alter publication supabase_realtime add table public.charging_sessions;

-- Optional: backfill profiles for existing users (no-op on fresh project)
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
