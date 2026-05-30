import type { BydmateLiveSnapshotRow } from "@/types/database";

/** Fresh live snapshot for dev “driving” mode on the cockpit. */
export function buildDrivingSnapshot(base: BydmateLiveSnapshotRow): BydmateLiveSnapshotRow {
  const now = new Date().toISOString();
  return {
    ...base,
    device_time: now,
    received_at: now,
    updated_at: now,
    telemetry: {
      ...base.telemetry,
      speed_kmh: 38,
      power_kw: 17,
      is_charging: false,
      charge_power_kw: 0,
    },
  };
}

/** Parked, not charging — for optional dev QA. */
export function buildParkedSnapshot(base: BydmateLiveSnapshotRow): BydmateLiveSnapshotRow {
  const now = new Date().toISOString();
  return {
    ...base,
    device_time: now,
    received_at: now,
    updated_at: now,
    telemetry: {
      ...base.telemetry,
      speed_kmh: 0,
      power_kw: 0,
      is_charging: false,
      charge_power_kw: 0,
    },
  };
}
