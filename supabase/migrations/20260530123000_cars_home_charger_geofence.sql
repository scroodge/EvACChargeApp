-- Home charger geofence on car profile (optional lat/lon/radius for auto-tariff).

alter table public.cars
  add column if not exists home_charger_lat double precision,
  add column if not exists home_charger_lon double precision,
  add column if not exists home_charger_radius_m numeric not null default 150
    check (home_charger_radius_m > 0 and home_charger_radius_m <= 5000);
