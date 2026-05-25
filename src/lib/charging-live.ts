import {
  costFromGridEnergy,
  energyFromGridKwh,
  energyNeededKwh,
  type ChargingParams,
  type DerivedChargingState,
} from "@/lib/charging-math";
import type { BydmateLiveSnapshotRow } from "@/types/database";

export const LIVE_CHARGING_STALE_MS = 90_000;

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function snapshotSoc(snapshot: BydmateLiveSnapshotRow | null | undefined) {
  const soc = finiteNumber(snapshot?.telemetry?.soc) ?? finiteNumber(snapshot?.diplus?.soc);
  return soc != null && soc >= 0 && soc <= 100 ? soc : null;
}

export function snapshotChargePowerKw(snapshot: BydmateLiveSnapshotRow | null | undefined) {
  const power =
    finiteNumber(snapshot?.telemetry?.charge_power_kw) ??
    finiteNumber(snapshot?.telemetry?.power_kw);
  return power != null && power > 0 ? power : null;
}

export function isFreshChargingSnapshot(
  snapshot: BydmateLiveSnapshotRow | null | undefined,
  nowMs: number,
  staleMs = LIVE_CHARGING_STALE_MS,
) {
  if (!snapshot) return false;
  const receivedMs = Date.parse(snapshot.received_at);
  if (!Number.isFinite(receivedMs) || nowMs - receivedMs > staleMs) return false;
  return snapshot.telemetry?.is_charging === true || snapshotChargePowerKw(snapshot) != null;
}

export function deriveLiveChargingState({
  snapshot,
  params,
  startedAtMs,
  nowMs,
}: {
  snapshot: BydmateLiveSnapshotRow | null | undefined;
  params: ChargingParams;
  startedAtMs: number;
  nowMs: number;
}): DerivedChargingState | null {
  if (!isFreshChargingSnapshot(snapshot, nowMs)) return null;

  const soc = snapshotSoc(snapshot);
  if (soc == null) return null;

  const currentPercent = Math.min(params.targetPercent, Math.max(params.startPercent, soc));
  const batteryEnergyKwh = energyNeededKwh(
    params.batteryCapacityKwh,
    params.startPercent,
    currentPercent,
  );
  const chargedEnergyKwh = energyFromGridKwh(batteryEnergyKwh, params.efficiencyPercent);
  const estimatedCost = costFromGridEnergy(chargedEnergyKwh, params.pricePerKwh);
  const elapsedSeconds = Math.max(0, (nowMs - startedAtMs) / 1000);
  const isComplete = soc >= params.targetPercent;
  const chargePowerKw = snapshotChargePowerKw(snapshot);
  const remainingGridEnergyKwh = energyFromGridKwh(
    energyNeededKwh(params.batteryCapacityKwh, currentPercent, params.targetPercent),
    params.efficiencyPercent,
  );

  return {
    currentPercent,
    chargedEnergyKwh,
    estimatedCost,
    elapsedSeconds,
    remainingSeconds:
      !isComplete && chargePowerKw != null
        ? (remainingGridEnergyKwh / chargePowerKw) * 3600
        : 0,
    isComplete,
  };
}
