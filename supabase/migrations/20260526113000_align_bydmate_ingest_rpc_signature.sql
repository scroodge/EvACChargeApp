-- Keep the RPC signature used by the Next.js API aligned with the latest
-- BYDMate ingest behavior. The 20260526101500 migration updated the 9-argument
-- function, but the API and batch ingest call the 10-argument Di+ signature.

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
    coalesce(p_raw_payload, '{}'::jsonb) || jsonb_build_object('diplus', v_diplus)
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

revoke all on function public.bydmate_ingest_telemetry(uuid, text, text, integer, timestamptz, timestamptz, jsonb, jsonb, jsonb, jsonb)
  from public;
grant execute on function public.bydmate_ingest_telemetry(uuid, text, text, integer, timestamptz, timestamptz, jsonb, jsonb, jsonb, jsonb)
  to service_role;
