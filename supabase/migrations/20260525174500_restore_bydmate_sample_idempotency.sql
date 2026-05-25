-- Restore idempotency after adding stale-batch skipping. The stale skip lets
-- BYDMateOWN clear old retry queues quickly; this unique index prevents a
-- retried HTTP request from inserting the same historical sample repeatedly.

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
