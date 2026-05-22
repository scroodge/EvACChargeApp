-- Preserve BYDMate Di+ payloads and normalize cell voltage from telemetry/Di+
-- sources using the Android app's preferred fallback order.

drop function if exists public.bydmate_apply_diplus_columns(
  regclass,
  text,
  jsonb,
  uuid,
  text,
  timestamptz,
  timestamptz
);

create or replace function public.bydmate_apply_diplus_columns(
  p_table regclass,
  p_where text,
  p_diplus jsonb,
  p_user_id uuid,
  p_vehicle_id text,
  p_device_time timestamptz default null,
  p_received_at timestamptz default null,
  p_telemetry jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_diplus jsonb := coalesce(p_diplus, '{}'::jsonb);
  v_telemetry jsonb := coalesce(p_telemetry, '{}'::jsonb);
  v_min_cell_voltage numeric;
  v_max_cell_voltage numeric;
  v_cell_delta numeric;
begin
  v_min_cell_voltage := coalesce(
    public.bydmate_jsonb_numeric(v_telemetry, 'diplus_min_cell_voltage_v'),
    public.bydmate_jsonb_numeric(v_telemetry, 'cell_voltage_min_v'),
    public.bydmate_jsonb_numeric(v_diplus, 'min_cell_voltage_v')
  );

  v_max_cell_voltage := coalesce(
    public.bydmate_jsonb_numeric(v_telemetry, 'diplus_max_cell_voltage_v'),
    public.bydmate_jsonb_numeric(v_telemetry, 'cell_voltage_max_v'),
    public.bydmate_jsonb_numeric(v_diplus, 'max_cell_voltage_v')
  );

  v_cell_delta := coalesce(
    public.bydmate_jsonb_numeric(v_telemetry, 'diplus_cell_delta_v'),
    public.bydmate_jsonb_numeric(v_telemetry, 'cell_delta_v'),
    public.bydmate_jsonb_numeric(v_diplus, 'cell_delta_v'),
    case
      when v_min_cell_voltage is not null and v_max_cell_voltage is not null
        then v_max_cell_voltage - v_min_cell_voltage
      else null
    end
  );

  execute format(
    'update %s
     set
       diplus = coalesce($1, diplus),
       diplus_soc = public.bydmate_jsonb_numeric($2, ''soc''),
       diplus_speed_kmh = public.bydmate_jsonb_numeric($2, ''speed_kmh''),
       diplus_mileage_km = public.bydmate_jsonb_numeric($2, ''mileage_km''),
       diplus_power_kw = public.bydmate_jsonb_numeric($2, ''power_kw''),
       diplus_charge_gun_state = public.bydmate_jsonb_text($2, ''charge_gun_state''),
       diplus_charging_status = public.bydmate_jsonb_text($2, ''charging_status''),
       diplus_battery_capacity_kwh = public.bydmate_jsonb_numeric($2, ''battery_capacity_kwh''),
       diplus_total_elec_consumption_kwh = public.bydmate_jsonb_numeric($2, ''total_elec_consumption_kwh''),
       diplus_voltage_12v = public.bydmate_jsonb_numeric($2, ''voltage_12v''),
       diplus_max_cell_voltage_v = $8,
       diplus_min_cell_voltage_v = $7,
       diplus_cell_delta_v = $9,
       diplus_avg_battery_temp_c = public.bydmate_jsonb_numeric($2, ''avg_battery_temp_c''),
       diplus_exterior_temp_c = public.bydmate_jsonb_numeric($2, ''exterior_temp_c''),
       diplus_gear = public.bydmate_jsonb_text($2, ''gear''),
       diplus_power_state = public.bydmate_jsonb_text($2, ''power_state''),
       diplus_inside_temp_c = public.bydmate_jsonb_numeric($2, ''inside_temp_c''),
       diplus_ac_status = public.bydmate_jsonb_text($2, ''ac_status''),
       diplus_ac_temp_c = public.bydmate_jsonb_numeric($2, ''ac_temp_c''),
       diplus_fan_level = public.bydmate_jsonb_numeric($2, ''fan_level''),
       diplus_door_fl = public.bydmate_jsonb_text($2, ''door_fl''),
       diplus_door_fr = public.bydmate_jsonb_text($2, ''door_fr''),
       diplus_door_rl = public.bydmate_jsonb_text($2, ''door_rl''),
       diplus_door_rr = public.bydmate_jsonb_text($2, ''door_rr''),
       diplus_window_fl_percent = public.bydmate_jsonb_numeric($2, ''window_fl_percent''),
       diplus_window_fr_percent = public.bydmate_jsonb_numeric($2, ''window_fr_percent''),
       diplus_window_rl_percent = public.bydmate_jsonb_numeric($2, ''window_rl_percent''),
       diplus_window_rr_percent = public.bydmate_jsonb_numeric($2, ''window_rr_percent''),
       diplus_sunroof_percent = public.bydmate_jsonb_numeric($2, ''sunroof_percent''),
       diplus_trunk = public.bydmate_jsonb_text($2, ''trunk''),
       diplus_hood = public.bydmate_jsonb_text($2, ''hood''),
       diplus_tire_press_fl_kpa = public.bydmate_jsonb_numeric($2, ''tire_press_fl_kpa''),
       diplus_tire_press_fr_kpa = public.bydmate_jsonb_numeric($2, ''tire_press_fr_kpa''),
       diplus_tire_press_rl_kpa = public.bydmate_jsonb_numeric($2, ''tire_press_rl_kpa''),
       diplus_tire_press_rr_kpa = public.bydmate_jsonb_numeric($2, ''tire_press_rr_kpa''),
       diplus_drive_mode = public.bydmate_jsonb_text($2, ''drive_mode''),
       diplus_work_mode = public.bydmate_jsonb_text($2, ''work_mode''),
       diplus_auto_park = public.bydmate_jsonb_text($2, ''auto_park''),
       diplus_rain = public.bydmate_jsonb_text($2, ''rain''),
       diplus_light_low = public.bydmate_jsonb_text($2, ''light_low''),
       diplus_drl = public.bydmate_jsonb_text($2, ''drl'')
     where ' || p_where,
    p_table
  )
  using p_diplus,
    v_diplus,
    p_user_id,
    p_vehicle_id,
    p_device_time,
    p_received_at,
    v_min_cell_voltage,
    v_max_cell_voltage,
    v_cell_delta;
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
  v_raw_payload jsonb := coalesce(p_raw_payload, '{}'::jsonb);
begin
  if p_diplus is not null then
    v_raw_payload := v_raw_payload || jsonb_build_object('diplus', p_diplus);
  end if;

  v_result := public.bydmate_ingest_telemetry(
    p_user_id,
    p_vehicle_id,
    p_source,
    p_schema_version,
    p_device_time,
    p_received_at,
    p_telemetry,
    p_location,
    v_raw_payload
  );

  perform public.bydmate_apply_diplus_columns(
    'public.bydmate_live_snapshots'::regclass,
    'user_id = $3 and vehicle_id = $4',
    p_diplus,
    p_user_id,
    p_vehicle_id,
    null,
    null,
    p_telemetry
  );

  perform public.bydmate_apply_diplus_columns(
    'public.bydmate_telemetry_samples'::regclass,
    'user_id = $3 and vehicle_id = $4 and device_time = $5 and received_at = $6',
    coalesce(p_diplus, '{}'::jsonb),
    p_user_id,
    p_vehicle_id,
    p_device_time,
    p_received_at,
    p_telemetry
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
      v_sample->'diplus',
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
