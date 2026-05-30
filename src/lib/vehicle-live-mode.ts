import type { BydmateLiveSnapshotRow } from "@/types/database";

export const LIVE_SNAPSHOT_STALE_MS = 90_000;
const MOVING_SPEED_THRESHOLD_KMH = 3;
const CHARGE_POWER_THRESHOLD_KW = 0.1;

export type DashboardVehicleMode =
  | "app_charging"
  | "live_charging"
  | "driving"
  | "parked"
  | "stale";

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function snapshotChargePowerKw(snapshot: BydmateLiveSnapshotRow | null | undefined) {
  const power =
    finiteNumber(snapshot?.telemetry?.charge_power_kw) ??
    finiteNumber(snapshot?.telemetry?.power_kw);
  return power != null && power > 0 ? power : null;
}

export function isFreshLiveSnapshot(
  snapshot: BydmateLiveSnapshotRow | null | undefined,
  nowMs: number,
  staleMs = LIVE_SNAPSHOT_STALE_MS,
) {
  if (!snapshot) return false;
  const receivedMs = Date.parse(snapshot.received_at);
  return Number.isFinite(receivedMs) && nowMs - receivedMs <= staleMs;
}

export function isChargingTelemetry(snapshot: BydmateLiveSnapshotRow | null | undefined) {
  if (!snapshot) return false;
  const telemetry = snapshot.telemetry;
  const chargePowerKw = finiteNumber(telemetry.charge_power_kw);
  return (
    telemetry.is_charging === true ||
    (chargePowerKw != null && chargePowerKw > CHARGE_POWER_THRESHOLD_KW) ||
    snapshotChargePowerKw(snapshot) != null
  );
}

export function isDrivingTelemetry(snapshot: BydmateLiveSnapshotRow | null | undefined) {
  if (!snapshot || isChargingTelemetry(snapshot)) return false;
  const speedKmh = finiteNumber(snapshot.telemetry.speed_kmh);
  return speedKmh != null && speedKmh > MOVING_SPEED_THRESHOLD_KMH;
}

export function deriveDashboardVehicleMode({
  snapshot,
  nowMs,
  hasActiveSession,
  staleMs = LIVE_SNAPSHOT_STALE_MS,
}: {
  snapshot: BydmateLiveSnapshotRow | null | undefined;
  nowMs: number;
  hasActiveSession: boolean;
  staleMs?: number;
}): DashboardVehicleMode {
  if (hasActiveSession) return "app_charging";
  if (!snapshot) return "stale";
  if (!isFreshLiveSnapshot(snapshot, nowMs, staleMs)) return "stale";
  if (isChargingTelemetry(snapshot)) return "live_charging";
  if (isDrivingTelemetry(snapshot)) return "driving";
  return "parked";
}

export function canStartChargingSession(mode: DashboardVehicleMode) {
  return mode === "parked" || mode === "stale" || mode === "live_charging";
}

export function snapshotSpeedDetail(
  snapshot: BydmateLiveSnapshotRow | null | undefined,
): string | null {
  const speedKmh = finiteNumber(snapshot?.telemetry.speed_kmh);
  if (speedKmh == null) return null;
  return `${Math.round(speedKmh)} km/h`;
}

export function resolveLiveSnapshotForVehicle(
  snapshots: BydmateLiveSnapshotRow[],
  vehicleId: string | null | undefined,
): BydmateLiveSnapshotRow | null {
  if (!snapshots.length) return null;
  if (!vehicleId) return snapshots[0] ?? null;
  return snapshots.find((row) => row.vehicle_id === vehicleId) ?? snapshots[0] ?? null;
}
