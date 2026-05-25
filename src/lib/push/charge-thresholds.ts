export const CHARGE_NOTIFICATION_THRESHOLDS = [25, 50, 75, 95, 100] as const;

export type ChargeNotificationState = {
  chargeStartedAt: string | null;
  lastSoc: number | null;
  lastIsCharging: boolean;
  notifiedThresholds: number[];
};

export type ChargeNotificationInput = {
  previousState: ChargeNotificationState | null;
  currentSoc: number | null;
  isCharging: boolean;
  deviceTime: string;
  previousSoc?: number | null;
};

function finiteSoc(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null;
}

function uniqueSortedThresholds(values: readonly number[]) {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function latestReachedThreshold(soc: number) {
  const reached = CHARGE_NOTIFICATION_THRESHOLDS.filter((threshold) => threshold <= soc);
  return reached.at(-1) ?? null;
}

export function nextChargeNotificationState(input: ChargeNotificationInput) {
  const currentSoc = finiteSoc(input.currentSoc);
  const previousSoc = finiteSoc(input.previousState?.lastSoc) ?? finiteSoc(input.previousSoc);
  const wasCharging = input.previousState?.lastIsCharging === true;

  if (!input.isCharging || currentSoc == null) {
    return {
      thresholdsToNotify: [] as number[],
      nextState: {
        chargeStartedAt: input.previousState?.chargeStartedAt ?? null,
        lastSoc: currentSoc ?? previousSoc,
        lastIsCharging: false,
        notifiedThresholds: [],
      } satisfies ChargeNotificationState,
    };
  }

  const startsNewCycle = !wasCharging || (previousSoc != null && currentSoc < previousSoc - 2);
  const alreadyNotified = startsNewCycle
    ? []
    : uniqueSortedThresholds(input.previousState?.notifiedThresholds ?? []);

  let crossedThresholds: number[];
  if (previousSoc != null && previousSoc <= currentSoc) {
    crossedThresholds = CHARGE_NOTIFICATION_THRESHOLDS.filter(
      (threshold) => previousSoc < threshold && threshold <= currentSoc,
    );
  } else {
    const threshold = latestReachedThreshold(currentSoc);
    crossedThresholds = threshold == null ? [] : [threshold];
  }

  const thresholdsToNotify = crossedThresholds.filter(
    (threshold) => !alreadyNotified.includes(threshold),
  );
  const notifiedThresholds = uniqueSortedThresholds([
    ...alreadyNotified,
    ...thresholdsToNotify,
  ]);

  return {
    thresholdsToNotify,
    nextState: {
      chargeStartedAt: startsNewCycle
        ? input.deviceTime
        : input.previousState?.chargeStartedAt ?? input.deviceTime,
      lastSoc: currentSoc,
      lastIsCharging: true,
      notifiedThresholds,
    } satisfies ChargeNotificationState,
  };
}
