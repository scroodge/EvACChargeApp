-- Optimize BYDMate telemetry storage for high-frequency charging samples.
-- - Remove legacy v1 history after v2 backfill.
-- - Drop broad Di+ indexes that amplify writes.
-- - Add idempotency constraints for client retries.
-- - Make hourly averages count only non-null samples going forward.

do $$
declare
  v_column text;
  v_columns text[] := array[
    'diplus_soc',
    'diplus_speed_kmh',
    'diplus_mileage_km',
    'diplus_power_kw',
    'diplus_charge_gun_state',
    'diplus_charging_status',
    'diplus_battery_capacity_kwh',
    'diplus_total_elec_consumption_kwh',
    'diplus_voltage_12v',
    'diplus_max_cell_voltage_v',
    'diplus_min_cell_voltage_v',
    'diplus_cell_delta_v',
    'diplus_avg_battery_temp_c',
    'diplus_exterior_temp_c',
    'diplus_gear',
    'diplus_power_state',
    'diplus_inside_temp_c',
    'diplus_ac_status',
    'diplus_ac_temp_c',
    'diplus_fan_level',
    'diplus_door_fl',
    'diplus_door_fr',
    'diplus_door_rl',
    'diplus_door_rr',
    'diplus_window_fl_percent',
    'diplus_window_fr_percent',
    'diplus_window_rl_percent',
    'diplus_window_rr_percent',
    'diplus_sunroof_percent',
    'diplus_trunk',
    'diplus_hood',
    'diplus_tire_press_fl_kpa',
    'diplus_tire_press_fr_kpa',
    'diplus_tire_press_rl_kpa',
    'diplus_tire_press_rr_kpa',
    'diplus_drive_mode',
    'diplus_work_mode',
    'diplus_auto_park',
    'diplus_rain',
    'diplus_light_low',
    'diplus_drl'
  ];
begin
  foreach v_column in array v_columns loop
    execute format('drop index if exists public.%I', 'bydmate_telemetry_samples_' || v_column || '_idx');
  end loop;
end;
$$;

drop index if exists public.bydmate_telemetry_samples_diplus_gin_idx;
drop index if exists public.bydmate_live_snapshots_diplus_gin_idx;

create index if not exists bydmate_telemetry_samples_charging_time_idx
  on public.bydmate_telemetry_samples (user_id, vehicle_id, device_time desc)
  where telemetry->>'is_charging' = 'true';

delete from public.bydmate_trip_track_points p
using public.bydmate_trip_track_points duplicate
where p.trip_id = duplicate.trip_id
  and p.device_time = duplicate.device_time
  and (
    p.id > duplicate.id
    or (p.id = duplicate.id and p.ctid > duplicate.ctid)
  );

delete from public.bydmate_telemetry_samples s
using public.bydmate_telemetry_samples duplicate
where s.user_id = duplicate.user_id
  and s.vehicle_id = duplicate.vehicle_id
  and s.device_time = duplicate.device_time
  and (
    s.received_at < duplicate.received_at
    or (s.received_at = duplicate.received_at and s.id > duplicate.id)
  );

create unique index if not exists bydmate_telemetry_samples_user_vehicle_device_unique
  on public.bydmate_telemetry_samples (user_id, vehicle_id, device_time);

create unique index if not exists bydmate_trip_track_points_trip_device_unique
  on public.bydmate_trip_track_points (trip_id, device_time);

alter table public.bydmate_telemetry_hourly
  add column if not exists power_sample_count integer not null default 0,
  add column if not exists battery_temp_sample_count integer not null default 0,
  add column if not exists cabin_temp_sample_count integer not null default 0,
  add column if not exists outside_temp_sample_count integer not null default 0;

update public.bydmate_telemetry_hourly
set
  power_sample_count = case when power_avg is null then 0 else sample_count end,
  battery_temp_sample_count = case when battery_temp_avg is null then 0 else sample_count end,
  cabin_temp_sample_count = case when cabin_temp_avg is null then 0 else sample_count end,
  outside_temp_sample_count = case when outside_temp_avg is null then 0 else sample_count end;

drop table if exists public.bydmate_telemetry_points;

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
  v_trip_distance numeric;
  v_consumption numeric;
  v_hour_start timestamptz;
  v_sample_id uuid;
  v_track_id uuid;
  v_battery_temp numeric;
  v_cabin_temp numeric;
  v_outside_temp numeric;
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
  )
  on conflict (user_id, vehicle_id, device_time) do nothing
  returning id into v_sample_id;

  if v_sample_id is null then
    return jsonb_build_object(
      'duplicate', true,
      'vehicle_id', p_vehicle_id,
      'last_device_time', p_device_time
    );
  end if;

  v_soc := nullif(p_telemetry->>'soc', '')::numeric;
  v_speed := nullif(p_telemetry->>'speed_kmh', '')::numeric;
  v_power := nullif(p_telemetry->>'power_kw', '')::numeric;
  v_battery_temp := nullif(p_telemetry->>'battery_temp_c', '')::numeric;
  v_cabin_temp := nullif(p_telemetry->>'cabin_temp_c', '')::numeric;
  v_outside_temp := nullif(p_telemetry->>'outside_temp_c', '')::numeric;
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
    outside_temp_avg,
    power_sample_count,
    battery_temp_sample_count,
    cabin_temp_sample_count,
    outside_temp_sample_count
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
    v_battery_temp,
    v_cabin_temp,
    v_outside_temp,
    case when v_power is null then 0 else 1 end,
    case when v_battery_temp is null then 0 else 1 end,
    case when v_cabin_temp is null then 0 else 1 end,
    case when v_outside_temp is null then 0 else 1 end
  )
  on conflict (user_id, vehicle_id, hour_start) do update
  set
    sample_count = public.bydmate_telemetry_hourly.sample_count + 1,
    soc_min = least(public.bydmate_telemetry_hourly.soc_min, excluded.soc_min),
    soc_max = greatest(public.bydmate_telemetry_hourly.soc_max, excluded.soc_max),
    soc_last = coalesce(excluded.soc_last, public.bydmate_telemetry_hourly.soc_last),
    speed_max = greatest(public.bydmate_telemetry_hourly.speed_max, excluded.speed_max),
    power_avg = case
      when excluded.power_sample_count = 0 then public.bydmate_telemetry_hourly.power_avg
      when public.bydmate_telemetry_hourly.power_sample_count = 0 then excluded.power_avg
      else (
        public.bydmate_telemetry_hourly.power_avg * public.bydmate_telemetry_hourly.power_sample_count
        + excluded.power_avg
      ) / (public.bydmate_telemetry_hourly.power_sample_count + excluded.power_sample_count)
    end,
    battery_temp_avg = case
      when excluded.battery_temp_sample_count = 0 then public.bydmate_telemetry_hourly.battery_temp_avg
      when public.bydmate_telemetry_hourly.battery_temp_sample_count = 0 then excluded.battery_temp_avg
      else (
        public.bydmate_telemetry_hourly.battery_temp_avg * public.bydmate_telemetry_hourly.battery_temp_sample_count
        + excluded.battery_temp_avg
      ) / (public.bydmate_telemetry_hourly.battery_temp_sample_count + excluded.battery_temp_sample_count)
    end,
    cabin_temp_avg = case
      when excluded.cabin_temp_sample_count = 0 then public.bydmate_telemetry_hourly.cabin_temp_avg
      when public.bydmate_telemetry_hourly.cabin_temp_sample_count = 0 then excluded.cabin_temp_avg
      else (
        public.bydmate_telemetry_hourly.cabin_temp_avg * public.bydmate_telemetry_hourly.cabin_temp_sample_count
        + excluded.cabin_temp_avg
      ) / (public.bydmate_telemetry_hourly.cabin_temp_sample_count + excluded.cabin_temp_sample_count)
    end,
    outside_temp_avg = case
      when excluded.outside_temp_sample_count = 0 then public.bydmate_telemetry_hourly.outside_temp_avg
      when public.bydmate_telemetry_hourly.outside_temp_sample_count = 0 then excluded.outside_temp_avg
      else (
        public.bydmate_telemetry_hourly.outside_temp_avg * public.bydmate_telemetry_hourly.outside_temp_sample_count
        + excluded.outside_temp_avg
      ) / (public.bydmate_telemetry_hourly.outside_temp_sample_count + excluded.outside_temp_sample_count)
    end,
    power_sample_count = public.bydmate_telemetry_hourly.power_sample_count + excluded.power_sample_count,
    battery_temp_sample_count = public.bydmate_telemetry_hourly.battery_temp_sample_count + excluded.battery_temp_sample_count,
    cabin_temp_sample_count = public.bydmate_telemetry_hourly.cabin_temp_sample_count + excluded.cabin_temp_sample_count,
    outside_temp_sample_count = public.bydmate_telemetry_hourly.outside_temp_sample_count + excluded.outside_temp_sample_count;

  select *
  into v_trip
  from public.bydmate_trips
  where user_id = p_user_id
    and vehicle_id = p_vehicle_id
    and ended_at is null
  for update;

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
    )
    on conflict (trip_id, device_time) do nothing
    returning id into v_track_id;

    if v_track_id is not null then
      update public.bydmate_trips
      set track_point_count = track_point_count + 1
      where id = v_trip.id
      returning * into v_trip;
    end if;
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
