-- User-defined names and park flags for clustered repeat routes (route insights).

create table if not exists public.bydmate_route_labels (
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id text not null,
  route_id text not null,
  name text,
  is_park boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, vehicle_id, route_id),
  constraint bydmate_route_labels_name_check
    check (name is null or char_length(trim(name)) between 1 and 80),
  constraint bydmate_route_labels_purpose_check
    check (name is not null or is_park)
);

create index if not exists bydmate_route_labels_user_vehicle_idx
  on public.bydmate_route_labels (user_id, vehicle_id);

create index if not exists bydmate_route_labels_park_idx
  on public.bydmate_route_labels (user_id, vehicle_id, is_park)
  where is_park;

alter table public.bydmate_route_labels enable row level security;

drop policy if exists "bydmate_route_labels_select_own" on public.bydmate_route_labels;
create policy "bydmate_route_labels_select_own"
  on public.bydmate_route_labels for select
  using (auth.uid() = user_id);

drop policy if exists "bydmate_route_labels_insert_own" on public.bydmate_route_labels;
create policy "bydmate_route_labels_insert_own"
  on public.bydmate_route_labels for insert
  with check (auth.uid() = user_id);

drop policy if exists "bydmate_route_labels_update_own" on public.bydmate_route_labels;
create policy "bydmate_route_labels_update_own"
  on public.bydmate_route_labels for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "bydmate_route_labels_delete_own" on public.bydmate_route_labels;
create policy "bydmate_route_labels_delete_own"
  on public.bydmate_route_labels for delete
  using (auth.uid() = user_id);
