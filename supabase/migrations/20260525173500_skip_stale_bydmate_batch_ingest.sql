-- Let BYDMateOWN clear retried buffered batches that are older than the live
-- snapshot. These batches should not move live data backwards, and reinserting
-- them can make the Android client hit its HTTP timeout and retry forever.

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
  v_skipped_stale_count integer := 0;
  v_last_vehicle_id text;
  v_last_device_time timestamptz;
  v_last_trip_id uuid;
  v_live_device_time timestamptz;
  v_sample_device_time timestamptz;
begin
  if jsonb_typeof(p_samples) <> 'array' then
    raise exception 'p_samples must be a JSON array';
  end if;

  for v_sample in
    select value
    from jsonb_array_elements(p_samples)
    order by nullif(value->>'device_time', '')::timestamptz asc
  loop
    v_last_vehicle_id := v_sample->>'vehicle_id';
    v_sample_device_time := nullif(v_sample->>'device_time', '')::timestamptz;
    v_last_device_time := v_sample_device_time;

    select live.device_time
    into v_live_device_time
    from public.bydmate_live_snapshots live
    where live.user_id = p_user_id
      and live.vehicle_id = v_last_vehicle_id;

    if v_live_device_time is not null and v_sample_device_time < v_live_device_time then
      v_skipped_stale_count := v_skipped_stale_count + 1;
      continue;
    end if;

    v_result := public.bydmate_ingest_telemetry(
      p_user_id,
      v_last_vehicle_id,
      coalesce(nullif(v_sample->>'source', ''), 'BYDMate'),
      coalesce(nullif(v_sample->>'schema_version', '')::integer, 1),
      v_sample_device_time,
      p_received_at,
      coalesce(v_sample->'telemetry', '{}'::jsonb),
      v_sample->'diplus',
      coalesce(v_sample->'location', '{}'::jsonb),
      v_sample
    );

    v_count := v_count + 1;
    v_last_trip_id := nullif(v_result->>'trip_id', '')::uuid;
  end loop;

  return jsonb_build_object(
    'sample_count', v_count,
    'skipped_stale_count', v_skipped_stale_count,
    'vehicle_id', v_last_vehicle_id,
    'last_device_time', v_last_device_time,
    'last_trip_id', v_last_trip_id
  );
end;
$$;

revoke all on function public.bydmate_ingest_telemetry_batch(uuid, timestamptz, jsonb)
  from public;
grant execute on function public.bydmate_ingest_telemetry_batch(uuid, timestamptz, jsonb)
  to service_role;
