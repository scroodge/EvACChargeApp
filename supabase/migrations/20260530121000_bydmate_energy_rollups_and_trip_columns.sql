-- Trip energy columns, hourly regen/traction sums, ingest helpers.

alter table public.bydmate_trips
  add column if not exists regen_energy_kwh numeric,
  add column if not exists traction_energy_kwh numeric;

alter table public.bydmate_telemetry_hourly
  add column if not exists regen_kwh_sum numeric not null default 0,
  add column if not exists traction_kwh_sum numeric not null default 0;

create or replace function public.bydmate_interval_energy_kwh(
  p_from_power numeric,
  p_to_power numeric,
  p_dt_seconds numeric
)
returns table(traction_kwh numeric, regen_kwh numeric)
language plpgsql
immutable
as $$
declare
  v_zero_fraction numeric;
begin
  if p_from_power is null or p_to_power is null or p_dt_seconds is null or p_dt_seconds <= 0 then
    traction_kwh := 0;
    regen_kwh := 0;
    return next;
    return;
  end if;

  if p_from_power >= 0 and p_to_power >= 0 then
    traction_kwh := ((p_from_power + p_to_power) / 2) * (p_dt_seconds / 3600);
    regen_kwh := 0;
    return next;
    return;
  end if;

  if p_from_power <= 0 and p_to_power <= 0 then
    traction_kwh := 0;
    regen_kwh := ((abs(p_from_power) + abs(p_to_power)) / 2) * (p_dt_seconds / 3600);
    return next;
    return;
  end if;

  if p_from_power = p_to_power then
    traction_kwh := 0;
    regen_kwh := 0;
    return next;
    return;
  end if;

  v_zero_fraction := p_from_power / (p_from_power - p_to_power);
  v_zero_fraction := least(1, greatest(0, v_zero_fraction));

  if p_from_power > 0 then
    traction_kwh := (p_from_power * v_zero_fraction * p_dt_seconds) / 2 / 3600;
    regen_kwh := (abs(p_to_power) * (1 - v_zero_fraction) * p_dt_seconds) / 2 / 3600;
  else
    traction_kwh := (p_to_power * (1 - v_zero_fraction) * p_dt_seconds) / 2 / 3600;
    regen_kwh := (abs(p_from_power) * v_zero_fraction * p_dt_seconds) / 2 / 3600;
  end if;

  return next;
end;
$$;

create or replace function public.bydmate_finalize_trip_energy(p_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.bydmate_trips%rowtype;
  v_prev_time timestamptz;
  v_prev_power numeric;
  v_dt_seconds numeric;
  v_energy record;
  v_regen numeric := 0;
  v_traction numeric := 0;
  v_sample record;
begin
  select * into v_trip from public.bydmate_trips where id = p_trip_id;
  if not found or v_trip.ended_at is null then
    return;
  end if;

  for v_sample in
    select
      s.device_time,
      nullif(s.telemetry->>'power_kw', '')::numeric as power_kw
    from public.bydmate_telemetry_samples s
    where s.user_id = v_trip.user_id
      and s.vehicle_id = v_trip.vehicle_id
      and s.device_time >= v_trip.started_at
      and s.device_time <= v_trip.ended_at
    order by s.device_time asc
  loop
    if v_prev_time is not null and v_prev_power is not null and v_sample.power_kw is not null then
      v_dt_seconds := extract(epoch from (v_sample.device_time - v_prev_time));
      if v_dt_seconds > 0 and v_dt_seconds <= 180 then
        select * into v_energy
        from public.bydmate_interval_energy_kwh(v_prev_power, v_sample.power_kw, v_dt_seconds);
        v_regen := v_regen + coalesce(v_energy.regen_kwh, 0);
        v_traction := v_traction + coalesce(v_energy.traction_kwh, 0);
      end if;
    end if;
    v_prev_time := v_sample.device_time;
    v_prev_power := v_sample.power_kw;
  end loop;

  update public.bydmate_trips
  set
    regen_energy_kwh = case when v_prev_power is not null then v_regen else null end,
    traction_energy_kwh = case when v_prev_power is not null then v_traction else null end
  where id = p_trip_id;
end;
$$;

create or replace function public.bydmate_update_hourly_energy(
  p_user_id uuid,
  p_vehicle_id text,
  p_device_time timestamptz,
  p_power numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev record;
  v_hour_start timestamptz;
  v_dt_seconds numeric;
  v_energy record;
begin
  if p_power is null then
    return;
  end if;

  select
    s.device_time,
    nullif(s.telemetry->>'power_kw', '')::numeric as power_kw
  into v_prev
  from public.bydmate_telemetry_samples s
  where s.user_id = p_user_id
    and s.vehicle_id = p_vehicle_id
    and s.device_time < p_device_time
  order by s.device_time desc
  limit 1;

  if not found or v_prev.power_kw is null then
    return;
  end if;

  v_dt_seconds := extract(epoch from (p_device_time - v_prev.device_time));
  if v_dt_seconds <= 0 or v_dt_seconds > 180 then
    return;
  end if;

  v_hour_start := date_trunc('hour', p_device_time at time zone 'utc');

  select * into v_energy
  from public.bydmate_interval_energy_kwh(v_prev.power_kw, p_power, v_dt_seconds);

  update public.bydmate_telemetry_hourly
  set
    regen_kwh_sum = regen_kwh_sum + coalesce(v_energy.regen_kwh, 0),
    traction_kwh_sum = traction_kwh_sum + coalesce(v_energy.traction_kwh, 0)
  where user_id = p_user_id
    and vehicle_id = p_vehicle_id
    and hour_start = v_hour_start;
end;
$$;

revoke all on function public.bydmate_finalize_trip_energy(uuid) from public;
revoke all on function public.bydmate_update_hourly_energy(uuid, text, timestamptz, numeric) from public;
grant execute on function public.bydmate_finalize_trip_energy(uuid) to service_role;
grant execute on function public.bydmate_update_hourly_energy(uuid, text, timestamptz, numeric) to service_role;
