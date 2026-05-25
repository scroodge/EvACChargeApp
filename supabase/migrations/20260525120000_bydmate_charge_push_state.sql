-- Track charging threshold push notifications per vehicle so each charging cycle
-- sends 25/50/75/95/100% once.
create table if not exists public.bydmate_charge_notification_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id text not null,
  charge_started_at timestamptz,
  last_device_time timestamptz,
  last_soc numeric check (last_soc is null or (last_soc >= 0 and last_soc <= 100)),
  last_is_charging boolean not null default false,
  notified_thresholds integer[] not null default '{}'::integer[],
  updated_at timestamptz not null default now(),
  primary key (user_id, vehicle_id)
);

drop trigger if exists set_bydmate_charge_notification_state_updated_at on public.bydmate_charge_notification_state;
create trigger set_bydmate_charge_notification_state_updated_at
before update on public.bydmate_charge_notification_state
for each row execute procedure public.set_updated_at();

alter table public.bydmate_charge_notification_state enable row level security;

create policy "bydmate_charge_notification_state_select_own"
  on public.bydmate_charge_notification_state for select
  using (auth.uid() = user_id);

create policy "bydmate_charge_notification_state_insert_own"
  on public.bydmate_charge_notification_state for insert
  with check (auth.uid() = user_id);

create policy "bydmate_charge_notification_state_update_own"
  on public.bydmate_charge_notification_state for update
  using (auth.uid() = user_id);

create policy "bydmate_charge_notification_state_delete_own"
  on public.bydmate_charge_notification_state for delete
  using (auth.uid() = user_id);
