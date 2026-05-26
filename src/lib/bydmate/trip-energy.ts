export const MAX_TRIP_ENERGY_GAP_SECONDS = 180;

export type PowerEnergyPoint = {
  device_time: string;
  power_kw?: number | null;
};

export type TripEnergySummary = {
  regen_energy_kwh: number | null;
  traction_energy_kwh: number | null;
  power_sample_count: number;
};

function finiteNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function elapsedSeconds(from: string, to: string) {
  const seconds = (Date.parse(to) - Date.parse(from)) / 1000;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function intervalEnergyKwh(fromPowerKw: number, toPowerKw: number, dtSeconds: number) {
  if (fromPowerKw >= 0 && toPowerKw >= 0) {
    return {
      traction: ((fromPowerKw + toPowerKw) / 2) * (dtSeconds / 3600),
      regen: 0,
    };
  }

  if (fromPowerKw <= 0 && toPowerKw <= 0) {
    return {
      traction: 0,
      regen: ((Math.abs(fromPowerKw) + Math.abs(toPowerKw)) / 2) * (dtSeconds / 3600),
    };
  }

  const zeroFraction = fromPowerKw / (fromPowerKw - toPowerKw);
  const clampedZeroFraction = Math.min(1, Math.max(0, zeroFraction));

  if (fromPowerKw > 0) {
    return {
      traction: (fromPowerKw * clampedZeroFraction * dtSeconds) / 2 / 3600,
      regen: (Math.abs(toPowerKw) * (1 - clampedZeroFraction) * dtSeconds) / 2 / 3600,
    };
  }

  return {
    traction: (toPowerKw * (1 - clampedZeroFraction) * dtSeconds) / 2 / 3600,
    regen: (Math.abs(fromPowerKw) * clampedZeroFraction * dtSeconds) / 2 / 3600,
  };
}

export function calculateTripEnergy(
  points: PowerEnergyPoint[],
  maxGapSeconds = MAX_TRIP_ENERGY_GAP_SECONDS,
): TripEnergySummary {
  let regenEnergyKwh = 0;
  let tractionEnergyKwh = 0;
  let powerSampleCount = 0;

  for (let index = 0; index < points.length; index += 1) {
    if (finiteNumber(points[index].power_kw) != null) {
      powerSampleCount += 1;
    }

    if (index === 0) continue;

    const previous = points[index - 1];
    const current = points[index];
    const dtSeconds = elapsedSeconds(previous.device_time, current.device_time);
    if (dtSeconds == null || dtSeconds > maxGapSeconds) continue;

    const previousPower = finiteNumber(previous.power_kw);
    const currentPower = finiteNumber(current.power_kw);
    if (previousPower == null || currentPower == null) continue;

    const energy = intervalEnergyKwh(previousPower, currentPower, dtSeconds);
    regenEnergyKwh += energy.regen;
    tractionEnergyKwh += energy.traction;
  }

  return {
    regen_energy_kwh: powerSampleCount > 1 ? regenEnergyKwh : null,
    traction_energy_kwh: powerSampleCount > 1 ? tractionEnergyKwh : null,
    power_sample_count: powerSampleCount,
  };
}

export function calculateCumulativeRegenPoints(
  points: PowerEnergyPoint[],
  maxGapSeconds = MAX_TRIP_ENERGY_GAP_SECONDS,
) {
  let recoveredKwh = 0;
  const cumulative: Array<{ time: number; value: number }> = [];

  for (let index = 0; index < points.length; index += 1) {
    const currentTime = Date.parse(points[index].device_time);
    if (!Number.isFinite(currentTime)) continue;

    if (index > 0) {
      const previous = points[index - 1];
      const dtSeconds = elapsedSeconds(previous.device_time, points[index].device_time);
      const previousPower = finiteNumber(previous.power_kw);
      const currentPower = finiteNumber(points[index].power_kw);

      if (
        dtSeconds != null &&
        dtSeconds <= maxGapSeconds &&
        previousPower != null &&
        currentPower != null
      ) {
        recoveredKwh += intervalEnergyKwh(previousPower, currentPower, dtSeconds).regen;
      }
    }

    cumulative.push({ time: currentTime, value: recoveredKwh });
  }

  return cumulative;
}
