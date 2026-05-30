-- Telemetry retention (90d raw, 3y hourly) + Realtime on live snapshots.

do $$
begin
  alter publication supabase_realtime add table public.bydmate_live_snapshots;
exception
  when duplicate_object then null;
end;
$$;

create or replace function public.purge_old_bydmate_telemetry()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_samples_deleted bigint;
  v_track_deleted bigint;
  v_hourly_deleted bigint;
begin
  delete from public.bydmate_trip_track_points
  where device_time < now() - interval '90 days';
  get diagnostics v_track_deleted = row_count;

  delete from public.bydmate_telemetry_samples
  where device_time < now() - interval '90 days';
  get diagnostics v_samples_deleted = row_count;

  delete from public.bydmate_telemetry_hourly
  where hour_start < now() - interval '3 years';
  get diagnostics v_hourly_deleted = row_count;

  return jsonb_build_object(
    'samples_deleted', v_samples_deleted,
    'track_points_deleted', v_track_deleted,
    'hourly_deleted', v_hourly_deleted
  );
end;
$$;

revoke all on function public.purge_old_bydmate_telemetry() from public;
grant execute on function public.purge_old_bydmate_telemetry() to service_role;

-- Schedule daily purge at 03:00 UTC when pg_cron is available (Supabase Pro).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'purge-bydmate-telemetry';

    perform cron.schedule(
      'purge-bydmate-telemetry',
      '0 3 * * *',
      $cron$select public.purge_old_bydmate_telemetry()$cron$
    );
  end if;
exception
  when undefined_table or undefined_function or invalid_schema_name then
    null;
end;
$$;
