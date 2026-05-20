-- BYDMate telemetry v2: lean samples + hourly rollups + server-side trips + per-trip GPS tracks.

create table if not exists public.bydmate_telemetry_samples (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  device_time timestamptz not null,
  received_at timestamptz not null default now(),
  telemetry jsonb not null default '{}'::jsonb
);

create index if not exists bydmate_telemetry_samples_user_vehicle_time_idx
  on public.bydmate_telemetry_samples (user_id, vehicle_id, device_time desc);

create index if not exists bydmate_telemetry_samples_user_time_idx
  on public.bydmate_telemetry_samples (user_id, device_time desc);

create table if not exists public.bydmate_telemetry_hourly (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id text not null,
  hour_start timestamptz not null,
  sample_count integer not null default 0,
  soc_min numeric,
  soc_max numeric,
  soc_last numeric,
  speed_max numeric,
  power_avg numeric,
  battery_temp_avg numeric,
  cabin_temp_avg numeric,
  outside_temp_avg numeric,
  constraint bydmate_telemetry_hourly_user_vehicle_hour_unique
    unique (user_id, vehicle_id, hour_start)
);

create index if not exists bydmate_telemetry_hourly_user_vehicle_hour_idx
  on public.bydmate_telemetry_hourly (user_id, vehicle_id, hour_start desc);

create table if not exists public.bydmate_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  last_device_time timestamptz not null,
  sample_count integer not null default 0,
  track_point_count integer not null default 0,
  distance_km numeric,
  soc_start numeric,
  soc_end numeric,
  max_speed_kmh numeric,
  avg_speed_kmh numeric,
  avg_consumption_kwh_100km numeric
);

create unique index if not exists bydmate_trips_open_unique
  on public.bydmate_trips (user_id, vehicle_id)
  where ended_at is null;

create index if not exists bydmate_trips_user_vehicle_started_idx
  on public.bydmate_trips (user_id, vehicle_id, started_at desc);

create table if not exists public.bydmate_trip_track_points (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.bydmate_trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  device_time timestamptz not null,
  lat double precision not null,
  lon double precision not null,
  accuracy_m numeric,
  bearing_deg numeric,
  speed_kmh numeric,
  power_kw numeric,
  soc numeric
);

create index if not exists bydmate_trip_track_points_trip_time_idx
  on public.bydmate_trip_track_points (trip_id, device_time);

alter table public.bydmate_telemetry_samples enable row level security;
alter table public.bydmate_telemetry_hourly enable row level security;
alter table public.bydmate_trips enable row level security;
alter table public.bydmate_trip_track_points enable row level security;

drop policy if exists "bydmate_telemetry_samples_select_own" on public.bydmate_telemetry_samples;
create policy "bydmate_telemetry_samples_select_own"
  on public.bydmate_telemetry_samples for select
  using (auth.uid() = user_id);

drop policy if exists "bydmate_telemetry_hourly_select_own" on public.bydmate_telemetry_hourly;
create policy "bydmate_telemetry_hourly_select_own"
  on public.bydmate_telemetry_hourly for select
  using (auth.uid() = user_id);

drop policy if exists "bydmate_trips_select_own" on public.bydmate_trips;
create policy "bydmate_trips_select_own"
  on public.bydmate_trips for select
  using (auth.uid() = user_id);

drop policy if exists "bydmate_trip_track_points_select_own" on public.bydmate_trip_track_points;
create policy "bydmate_trip_track_points_select_own"
  on public.bydmate_trip_track_points for select
  using (auth.uid() = user_id);

-- Atomic ingest: snapshot + sample + hourly rollup + trip + optional GPS track.
create or replace function public.bydmate_ingest_telemetry(
  p_user_id uuid,
  p_vehicle_id text,
  p_source text,
  p_schema_version integer,
  p_device_time timestamptz,
  p_received_at timestamptz,
  p_telemetry jsonb,
  p_location jsonb,
  p_raw_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_gap interval := interval '5 minutes';
  v_trip public.bydmate_trips%rowtype;
  v_lat double precision;
  v_lon double precision;
  v_soc numeric;
  v_speed numeric;
  v_power numeric;
  v_odometer numeric;
  v_trip_distance numeric;
  v_consumption numeric;
  v_hour_start timestamptz;
begin
  insert into public.bydmate_live_snapshots (
    vehicle_id,
    user_id,
    source,
    schema_version,
    device_time,
    received_at,
    telemetry,
    location,
    raw_payload
  )
  values (
    p_vehicle_id,
    p_user_id,
    p_source,
    p_schema_version,
    p_device_time,
    p_received_at,
    p_telemetry,
    p_location,
    p_raw_payload
  )
  on conflict (user_id, vehicle_id) do update
  set
    source = excluded.source,
    schema_version = excluded.schema_version,
    device_time = excluded.device_time,
    received_at = excluded.received_at,
    telemetry = excluded.telemetry,
    location = excluded.location,
    raw_payload = excluded.raw_payload;

  insert into public.bydmate_telemetry_samples (
    vehicle_id,
    user_id,
    device_time,
    received_at,
    telemetry
  )
  values (
    p_vehicle_id,
    p_user_id,
    p_device_time,
    p_received_at,
    p_telemetry
  );

  v_soc := nullif(p_telemetry->>'soc', '')::numeric;
  v_speed := nullif(p_telemetry->>'speed_kmh', '')::numeric;
  v_power := nullif(p_telemetry->>'power_kw', '')::numeric;
  v_hour_start := date_trunc('hour', p_device_time at time zone 'utc');

  insert into public.bydmate_telemetry_hourly (
    user_id,
    vehicle_id,
    hour_start,
    sample_count,
    soc_min,
    soc_max,
    soc_last,
    speed_max,
    power_avg,
    battery_temp_avg,
    cabin_temp_avg,
    outside_temp_avg
  )
  values (
    p_user_id,
    p_vehicle_id,
    v_hour_start,
    1,
    v_soc,
    v_soc,
    v_soc,
    v_speed,
    v_power,
    nullif(p_telemetry->>'battery_temp_c', '')::numeric,
    nullif(p_telemetry->>'cabin_temp_c', '')::numeric,
    nullif(p_telemetry->>'outside_temp_c', '')::numeric
  )
  on conflict (user_id, vehicle_id, hour_start) do update
  set
    sample_count = public.bydmate_telemetry_hourly.sample_count + 1,
    soc_min = least(public.bydmate_telemetry_hourly.soc_min, excluded.soc_min),
    soc_max = greatest(public.bydmate_telemetry_hourly.soc_max, excluded.soc_max),
    soc_last = coalesce(excluded.soc_last, public.bydmate_telemetry_hourly.soc_last),
    speed_max = greatest(public.bydmate_telemetry_hourly.speed_max, excluded.speed_max),
    power_avg = (
      coalesce(public.bydmate_telemetry_hourly.power_avg, 0) * public.bydmate_telemetry_hourly.sample_count
      + coalesce(excluded.power_avg, 0)
    ) / (public.bydmate_telemetry_hourly.sample_count + 1),
    battery_temp_avg = (
      coalesce(public.bydmate_telemetry_hourly.battery_temp_avg, 0) * public.bydmate_telemetry_hourly.sample_count
      + coalesce(excluded.battery_temp_avg, 0)
    ) / (public.bydmate_telemetry_hourly.sample_count + 1),
    cabin_temp_avg = (
      coalesce(public.bydmate_telemetry_hourly.cabin_temp_avg, 0) * public.bydmate_telemetry_hourly.sample_count
      + coalesce(excluded.cabin_temp_avg, 0)
    ) / (public.bydmate_telemetry_hourly.sample_count + 1),
    outside_temp_avg = (
      coalesce(public.bydmate_telemetry_hourly.outside_temp_avg, 0) * public.bydmate_telemetry_hourly.sample_count
      + coalesce(excluded.outside_temp_avg, 0)
    ) / (public.bydmate_telemetry_hourly.sample_count + 1);

  select *
  into v_trip
  from public.bydmate_trips
  where user_id = p_user_id
    and vehicle_id = p_vehicle_id
    and ended_at is null
  for update;

  v_odometer := nullif(p_telemetry->>'odometer_km', '')::numeric;
  v_trip_distance := nullif(p_telemetry->>'current_trip_distance_km', '')::numeric;
  v_consumption := nullif(p_telemetry->>'current_trip_consumption_kwh_100km', '')::numeric;

  if found then
    if p_device_time - v_trip.last_device_time > v_trip_gap then
      update public.bydmate_trips
      set ended_at = v_trip.last_device_time
      where id = v_trip.id;

      insert into public.bydmate_trips (
        user_id,
        vehicle_id,
        started_at,
        ended_at,
        last_device_time,
        sample_count,
        track_point_count,
        distance_km,
        soc_start,
        soc_end,
        max_speed_kmh,
        avg_speed_kmh,
        avg_consumption_kwh_100km
      )
      values (
        p_user_id,
        p_vehicle_id,
        p_device_time,
        null,
        p_device_time,
        1,
        0,
        v_trip_distance,
        v_soc,
        v_soc,
        v_speed,
        v_speed,
        v_consumption
      )
      returning * into v_trip;
    else
      update public.bydmate_trips
      set
        last_device_time = p_device_time,
        sample_count = sample_count + 1,
        soc_end = coalesce(v_soc, soc_end),
        max_speed_kmh = greatest(coalesce(max_speed_kmh, v_speed), coalesce(v_speed, max_speed_kmh)),
        avg_speed_kmh = case
          when v_speed is null then avg_speed_kmh
          when avg_speed_kmh is null then v_speed
          else (avg_speed_kmh * sample_count + v_speed) / (sample_count + 1)
        end,
        avg_consumption_kwh_100km = case
          when v_consumption is null then avg_consumption_kwh_100km
          when avg_consumption_kwh_100km is null then v_consumption
          else (avg_consumption_kwh_100km * sample_count + v_consumption) / (sample_count + 1)
        end,
        distance_km = coalesce(v_trip_distance, distance_km)
      where id = v_trip.id
      returning * into v_trip;
    end if;
  else
    insert into public.bydmate_trips (
      user_id,
      vehicle_id,
      started_at,
      ended_at,
      last_device_time,
      sample_count,
      track_point_count,
      distance_km,
      soc_start,
      soc_end,
      max_speed_kmh,
      avg_speed_kmh,
      avg_consumption_kwh_100km
    )
    values (
      p_user_id,
      p_vehicle_id,
      p_device_time,
      null,
      p_device_time,
      1,
      0,
      v_trip_distance,
      v_soc,
      v_soc,
      v_speed,
      v_speed,
      v_consumption
    )
    returning * into v_trip;
  end if;

  v_lat := nullif(p_location->>'lat', '')::double precision;
  v_lon := nullif(p_location->>'lon', '')::double precision;

  if v_lat is not null and v_lon is not null then
    insert into public.bydmate_trip_track_points (
      trip_id,
      user_id,
      device_time,
      lat,
      lon,
      accuracy_m,
      bearing_deg,
      speed_kmh,
      power_kw,
      soc
    )
    values (
      v_trip.id,
      p_user_id,
      p_device_time,
      v_lat,
      v_lon,
      nullif(p_location->>'accuracy_m', '')::numeric,
      nullif(p_location->>'bearing_deg', '')::numeric,
      v_speed,
      v_power,
      v_soc
    );

    update public.bydmate_trips
    set track_point_count = track_point_count + 1
    where id = v_trip.id;
  end if;

  return jsonb_build_object(
    'trip_id', v_trip.id,
    'sample_count', v_trip.sample_count,
    'track_point_count', v_trip.track_point_count
  );
end;
$$;

revoke all on function public.bydmate_ingest_telemetry(uuid, text, text, integer, timestamptz, timestamptz, jsonb, jsonb, jsonb)
  from public;
grant execute on function public.bydmate_ingest_telemetry(uuid, text, text, integer, timestamptz, timestamptz, jsonb, jsonb, jsonb)
  to service_role;
