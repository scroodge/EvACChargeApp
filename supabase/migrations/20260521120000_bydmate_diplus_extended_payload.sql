-- Store BYDMate Di+ extended payloads separately from normalized telemetry and
-- expose selected fields as indexed columns for analytics.

create or replace function public.bydmate_jsonb_numeric(payload jsonb, key text)
returns numeric
language sql
immutable
as $$
  select case
    when nullif(payload->>key, '') ~ '^\s*[-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][-+]?\d+)?\s*$'
      then nullif(payload->>key, '')::numeric
    else null
  end;
$$;

create or replace function public.bydmate_jsonb_text(payload jsonb, key text)
returns text
language sql
immutable
as $$
  select nullif(payload->>key, '');
$$;

alter table public.bydmate_live_snapshots
  add column if not exists diplus jsonb not null default '{}'::jsonb,
  add column if not exists diplus_soc numeric,
  add column if not exists diplus_speed_kmh numeric,
  add column if not exists diplus_mileage_km numeric,
  add column if not exists diplus_power_kw numeric,
  add column if not exists diplus_charge_gun_state text,
  add column if not exists diplus_charging_status text,
  add column if not exists diplus_battery_capacity_kwh numeric,
  add column if not exists diplus_total_elec_consumption_kwh numeric,
  add column if not exists diplus_voltage_12v numeric,
  add column if not exists diplus_max_cell_voltage_v numeric,
  add column if not exists diplus_min_cell_voltage_v numeric,
  add column if not exists diplus_cell_delta_v numeric,
  add column if not exists diplus_avg_battery_temp_c numeric,
  add column if not exists diplus_exterior_temp_c numeric,
  add column if not exists diplus_gear text,
  add column if not exists diplus_power_state text,
  add column if not exists diplus_inside_temp_c numeric,
  add column if not exists diplus_ac_status text,
  add column if not exists diplus_ac_temp_c numeric,
  add column if not exists diplus_fan_level numeric,
  add column if not exists diplus_door_fl text,
  add column if not exists diplus_door_fr text,
  add column if not exists diplus_door_rl text,
  add column if not exists diplus_door_rr text,
  add column if not exists diplus_window_fl_percent numeric,
  add column if not exists diplus_window_fr_percent numeric,
  add column if not exists diplus_window_rl_percent numeric,
  add column if not exists diplus_window_rr_percent numeric,
  add column if not exists diplus_sunroof_percent numeric,
  add column if not exists diplus_trunk text,
  add column if not exists diplus_hood text,
  add column if not exists diplus_tire_press_fl_kpa numeric,
  add column if not exists diplus_tire_press_fr_kpa numeric,
  add column if not exists diplus_tire_press_rl_kpa numeric,
  add column if not exists diplus_tire_press_rr_kpa numeric,
  add column if not exists diplus_drive_mode text,
  add column if not exists diplus_work_mode text,
  add column if not exists diplus_auto_park text,
  add column if not exists diplus_rain text,
  add column if not exists diplus_light_low text,
  add column if not exists diplus_drl text;

alter table public.bydmate_telemetry_samples
  add column if not exists diplus jsonb not null default '{}'::jsonb,
  add column if not exists diplus_soc numeric,
  add column if not exists diplus_speed_kmh numeric,
  add column if not exists diplus_mileage_km numeric,
  add column if not exists diplus_power_kw numeric,
  add column if not exists diplus_charge_gun_state text,
  add column if not exists diplus_charging_status text,
  add column if not exists diplus_battery_capacity_kwh numeric,
  add column if not exists diplus_total_elec_consumption_kwh numeric,
  add column if not exists diplus_voltage_12v numeric,
  add column if not exists diplus_max_cell_voltage_v numeric,
  add column if not exists diplus_min_cell_voltage_v numeric,
  add column if not exists diplus_cell_delta_v numeric,
  add column if not exists diplus_avg_battery_temp_c numeric,
  add column if not exists diplus_exterior_temp_c numeric,
  add column if not exists diplus_gear text,
  add column if not exists diplus_power_state text,
  add column if not exists diplus_inside_temp_c numeric,
  add column if not exists diplus_ac_status text,
  add column if not exists diplus_ac_temp_c numeric,
  add column if not exists diplus_fan_level numeric,
  add column if not exists diplus_door_fl text,
  add column if not exists diplus_door_fr text,
  add column if not exists diplus_door_rl text,
  add column if not exists diplus_door_rr text,
  add column if not exists diplus_window_fl_percent numeric,
  add column if not exists diplus_window_fr_percent numeric,
  add column if not exists diplus_window_rl_percent numeric,
  add column if not exists diplus_window_rr_percent numeric,
  add column if not exists diplus_sunroof_percent numeric,
  add column if not exists diplus_trunk text,
  add column if not exists diplus_hood text,
  add column if not exists diplus_tire_press_fl_kpa numeric,
  add column if not exists diplus_tire_press_fr_kpa numeric,
  add column if not exists diplus_tire_press_rl_kpa numeric,
  add column if not exists diplus_tire_press_rr_kpa numeric,
  add column if not exists diplus_drive_mode text,
  add column if not exists diplus_work_mode text,
  add column if not exists diplus_auto_park text,
  add column if not exists diplus_rain text,
  add column if not exists diplus_light_low text,
  add column if not exists diplus_drl text;

create index if not exists bydmate_live_snapshots_diplus_gin_idx
  on public.bydmate_live_snapshots using gin (diplus);

create index if not exists bydmate_telemetry_samples_diplus_gin_idx
  on public.bydmate_telemetry_samples using gin (diplus);

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
    execute format(
      'create index if not exists %I on public.bydmate_telemetry_samples (user_id, vehicle_id, %I, device_time desc) where %I is not null',
      'bydmate_telemetry_samples_' || v_column || '_idx',
      v_column,
      v_column
    );
  end loop;
end;
$$;

create or replace function public.bydmate_apply_diplus_columns(
  p_table regclass,
  p_where text,
  p_diplus jsonb,
  p_user_id uuid,
  p_vehicle_id text,
  p_device_time timestamptz default null,
  p_received_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute format(
    'update %s
     set
       diplus = $1,
       diplus_soc = public.bydmate_jsonb_numeric($1, ''soc''),
       diplus_speed_kmh = public.bydmate_jsonb_numeric($1, ''speed_kmh''),
       diplus_mileage_km = public.bydmate_jsonb_numeric($1, ''mileage_km''),
       diplus_power_kw = public.bydmate_jsonb_numeric($1, ''power_kw''),
       diplus_charge_gun_state = public.bydmate_jsonb_text($1, ''charge_gun_state''),
       diplus_charging_status = public.bydmate_jsonb_text($1, ''charging_status''),
       diplus_battery_capacity_kwh = public.bydmate_jsonb_numeric($1, ''battery_capacity_kwh''),
       diplus_total_elec_consumption_kwh = public.bydmate_jsonb_numeric($1, ''total_elec_consumption_kwh''),
       diplus_voltage_12v = public.bydmate_jsonb_numeric($1, ''voltage_12v''),
       diplus_max_cell_voltage_v = public.bydmate_jsonb_numeric($1, ''max_cell_voltage_v''),
       diplus_min_cell_voltage_v = public.bydmate_jsonb_numeric($1, ''min_cell_voltage_v''),
       diplus_cell_delta_v = public.bydmate_jsonb_numeric($1, ''cell_delta_v''),
       diplus_avg_battery_temp_c = public.bydmate_jsonb_numeric($1, ''avg_battery_temp_c''),
       diplus_exterior_temp_c = public.bydmate_jsonb_numeric($1, ''exterior_temp_c''),
       diplus_gear = public.bydmate_jsonb_text($1, ''gear''),
       diplus_power_state = public.bydmate_jsonb_text($1, ''power_state''),
       diplus_inside_temp_c = public.bydmate_jsonb_numeric($1, ''inside_temp_c''),
       diplus_ac_status = public.bydmate_jsonb_text($1, ''ac_status''),
       diplus_ac_temp_c = public.bydmate_jsonb_numeric($1, ''ac_temp_c''),
       diplus_fan_level = public.bydmate_jsonb_numeric($1, ''fan_level''),
       diplus_door_fl = public.bydmate_jsonb_text($1, ''door_fl''),
       diplus_door_fr = public.bydmate_jsonb_text($1, ''door_fr''),
       diplus_door_rl = public.bydmate_jsonb_text($1, ''door_rl''),
       diplus_door_rr = public.bydmate_jsonb_text($1, ''door_rr''),
       diplus_window_fl_percent = public.bydmate_jsonb_numeric($1, ''window_fl_percent''),
       diplus_window_fr_percent = public.bydmate_jsonb_numeric($1, ''window_fr_percent''),
       diplus_window_rl_percent = public.bydmate_jsonb_numeric($1, ''window_rl_percent''),
       diplus_window_rr_percent = public.bydmate_jsonb_numeric($1, ''window_rr_percent''),
       diplus_sunroof_percent = public.bydmate_jsonb_numeric($1, ''sunroof_percent''),
       diplus_trunk = public.bydmate_jsonb_text($1, ''trunk''),
       diplus_hood = public.bydmate_jsonb_text($1, ''hood''),
       diplus_tire_press_fl_kpa = public.bydmate_jsonb_numeric($1, ''tire_press_fl_kpa''),
       diplus_tire_press_fr_kpa = public.bydmate_jsonb_numeric($1, ''tire_press_fr_kpa''),
       diplus_tire_press_rl_kpa = public.bydmate_jsonb_numeric($1, ''tire_press_rl_kpa''),
       diplus_tire_press_rr_kpa = public.bydmate_jsonb_numeric($1, ''tire_press_rr_kpa''),
       diplus_drive_mode = public.bydmate_jsonb_text($1, ''drive_mode''),
       diplus_work_mode = public.bydmate_jsonb_text($1, ''work_mode''),
       diplus_auto_park = public.bydmate_jsonb_text($1, ''auto_park''),
       diplus_rain = public.bydmate_jsonb_text($1, ''rain''),
       diplus_light_low = public.bydmate_jsonb_text($1, ''light_low''),
       diplus_drl = public.bydmate_jsonb_text($1, ''drl'')
     where ' || p_where,
    p_table
  )
  using coalesce(p_diplus, '{}'::jsonb), p_user_id, p_vehicle_id, p_device_time, p_received_at;
end;
$$;

create or replace function public.bydmate_ingest_telemetry(
  p_user_id uuid,
  p_vehicle_id text,
  p_source text,
  p_schema_version integer,
  p_device_time timestamptz,
  p_received_at timestamptz,
  p_telemetry jsonb,
  p_diplus jsonb,
  p_location jsonb,
  p_raw_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_diplus jsonb := coalesce(p_diplus, '{}'::jsonb);
begin
  v_result := public.bydmate_ingest_telemetry(
    p_user_id,
    p_vehicle_id,
    p_source,
    p_schema_version,
    p_device_time,
    p_received_at,
    p_telemetry,
    p_location,
    p_raw_payload || jsonb_build_object('diplus', v_diplus)
  );

  perform public.bydmate_apply_diplus_columns(
    'public.bydmate_live_snapshots'::regclass,
    'user_id = $2 and vehicle_id = $3',
    v_diplus,
    p_user_id,
    p_vehicle_id
  );

  perform public.bydmate_apply_diplus_columns(
    'public.bydmate_telemetry_samples'::regclass,
    'user_id = $2 and vehicle_id = $3 and device_time = $4 and received_at = $5',
    v_diplus,
    p_user_id,
    p_vehicle_id,
    p_device_time,
    p_received_at
  );

  return v_result;
end;
$$;

create or replace function public.bydmate_ingest_telemetry_batch(
  p_user_id uuid,
  p_received_at timestamptz,
  p_samples jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sample jsonb;
  v_result jsonb;
  v_count integer := 0;
  v_last_vehicle_id text;
  v_last_device_time timestamptz;
  v_last_trip_id uuid;
begin
  if jsonb_typeof(p_samples) <> 'array' then
    raise exception 'p_samples must be a JSON array';
  end if;

  for v_sample in
    select value
    from jsonb_array_elements(p_samples)
    order by nullif(value->>'device_time', '')::timestamptz asc
  loop
    v_result := public.bydmate_ingest_telemetry(
      p_user_id,
      v_sample->>'vehicle_id',
      coalesce(nullif(v_sample->>'source', ''), 'BYDMate'),
      coalesce(nullif(v_sample->>'schema_version', '')::integer, 1),
      nullif(v_sample->>'device_time', '')::timestamptz,
      p_received_at,
      coalesce(v_sample->'telemetry', '{}'::jsonb),
      coalesce(v_sample->'diplus', '{}'::jsonb),
      coalesce(v_sample->'location', '{}'::jsonb),
      v_sample
    );

    v_count := v_count + 1;
    v_last_vehicle_id := v_sample->>'vehicle_id';
    v_last_device_time := nullif(v_sample->>'device_time', '')::timestamptz;
    v_last_trip_id := nullif(v_result->>'trip_id', '')::uuid;
  end loop;

  return jsonb_build_object(
    'sample_count', v_count,
    'vehicle_id', v_last_vehicle_id,
    'last_device_time', v_last_device_time,
    'last_trip_id', v_last_trip_id
  );
end;
$$;

revoke all on function public.bydmate_ingest_telemetry(uuid, text, text, integer, timestamptz, timestamptz, jsonb, jsonb, jsonb, jsonb)
  from public;
grant execute on function public.bydmate_ingest_telemetry(uuid, text, text, integer, timestamptz, timestamptz, jsonb, jsonb, jsonb, jsonb)
  to service_role;

revoke all on function public.bydmate_ingest_telemetry_batch(uuid, timestamptz, jsonb)
  from public;
grant execute on function public.bydmate_ingest_telemetry_batch(uuid, timestamptz, jsonb)
  to service_role;
