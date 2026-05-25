import test from "node:test";
import assert from "node:assert/strict";

import { nextChargeNotificationState } from "./charge-thresholds.ts";

test("notifies each crossed 25 percent threshold, 95, and 100 once while charging", () => {
  const first = nextChargeNotificationState({
    previousState: {
      chargeStartedAt: "2026-05-25T10:00:00.000Z",
      lastSoc: 24,
      lastIsCharging: true,
      notifiedThresholds: [],
    },
    currentSoc: 50,
    isCharging: true,
    deviceTime: "2026-05-25T10:30:00.000Z",
  });

  assert.deepEqual(first.thresholdsToNotify, [25, 50]);

  const second = nextChargeNotificationState({
    previousState: first.nextState,
    currentSoc: 96,
    isCharging: true,
    deviceTime: "2026-05-25T11:30:00.000Z",
  });

  assert.deepEqual(second.thresholdsToNotify, [75, 95]);

  const duplicate = nextChargeNotificationState({
    previousState: second.nextState,
    currentSoc: 100,
    isCharging: true,
    deviceTime: "2026-05-25T11:35:00.000Z",
  });

  assert.deepEqual(duplicate.thresholdsToNotify, [100]);

  const afterFull = nextChargeNotificationState({
    previousState: duplicate.nextState,
    currentSoc: 100,
    isCharging: true,
    deviceTime: "2026-05-25T11:40:00.000Z",
  });

  assert.deepEqual(afterFull.thresholdsToNotify, []);
});

test("resets notified thresholds when charging stops", () => {
  const stopped = nextChargeNotificationState({
    previousState: {
      chargeStartedAt: "2026-05-25T10:00:00.000Z",
      lastSoc: 76,
      lastIsCharging: true,
      notifiedThresholds: [25, 50, 75],
    },
    currentSoc: 76,
    isCharging: false,
    deviceTime: "2026-05-25T12:00:00.000Z",
  });

  assert.equal(stopped.nextState.lastIsCharging, false);
  assert.deepEqual(stopped.nextState.notifiedThresholds, []);
});

test("uses the previous live snapshot to detect the first charging crossing", () => {
  const result = nextChargeNotificationState({
    previousState: null,
    previousSoc: 24,
    currentSoc: 26,
    isCharging: true,
    deviceTime: "2026-05-25T10:05:00.000Z",
  });

  assert.deepEqual(result.thresholdsToNotify, [25]);
});
