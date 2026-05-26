-- Di+ numeric charging_status=1 can be present while the car is driving.
-- Treat charging as charging only when telemetry says so, charge power is
-- positive, or Di+ exposes an explicit textual charging state.

do $$
declare
  v_function text;
  v_updated_function text;
begin
  select pg_get_functiondef(
    'public.bydmate_ingest_telemetry(uuid, text, text, integer, timestamptz, timestamptz, jsonb, jsonb, jsonb)'::regprocedure
  )
  into v_function;

  v_updated_function := replace(
    v_function,
    $old$
  v_is_charging :=
    lower(coalesce(p_telemetry->>'is_charging', '')) in ('true', '1', 'yes', 'on') or
    coalesce(v_charge_power, 0) > 0.1 or
    v_diplus_charging_status in ('charging', 'charge', 'active', 'on', 'true', '1', 'yes') or
    v_diplus_charge_gun_state in ('connected', 'plugged', 'inserted', 'on', 'true', 'yes');
$old$,
    $new$
  v_is_charging :=
    lower(coalesce(p_telemetry->>'is_charging', '')) in ('true', '1', 'yes', 'on') or
    coalesce(v_charge_power, 0) > 0.1 or
    v_diplus_charging_status in ('charging', 'charge', 'active');
$new$
  );

  if v_updated_function = v_function then
    raise exception 'bydmate_ingest_telemetry charging detection block was not found';
  end if;

  execute v_updated_function;
end;
$$;
