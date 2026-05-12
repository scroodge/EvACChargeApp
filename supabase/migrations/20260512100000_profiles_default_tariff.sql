-- Persist the user's default electricity tariff at account level.
alter table public.profiles
add column if not exists default_price_per_kwh numeric not null default 0.12
  check (default_price_per_kwh >= 0);
