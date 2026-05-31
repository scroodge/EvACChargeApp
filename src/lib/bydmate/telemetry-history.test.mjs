import test from "node:test";
import assert from "node:assert/strict";

import { resolveChargingSessionSampleWindow } from "./telemetry-session-window.ts";
import { medianSampleGapSeconds } from "./telemetry-ranges.ts";

test("extends completed charging sample window to include delayed target samples", () => {
  const window = resolveChargingSessionSampleWindow({
    status: "completed",
    startedAt: "2026-05-26T06:28:59.855Z",
    stoppedAt: "2026-05-26T09:20:49.834Z",
    updatedAt: "2026-05-26T09:20:49.915Z",
    currentPercent: 100,
    targetPercent: 100,
  });

  assert.equal(window.from, "2026-05-26T06:28:59.855Z");
  assert.equal(window.to, "2026-05-26T09:30:49.834Z");
});

test("does not extend manually stopped charging sample windows", () => {
  const window = resolveChargingSessionSampleWindow({
    status: "stopped",
    startedAt: "2026-05-26T06:28:59.855Z",
    stoppedAt: "2026-05-26T09:20:49.834Z",
    updatedAt: "2026-05-26T09:20:49.915Z",
    currentPercent: 99,
    targetPercent: 100,
  });

  assert.equal(window.to, "2026-05-26T09:20:49.834Z");
});

test("medianSampleGapSeconds returns null for fewer than two timestamps", () => {
  assert.equal(medianSampleGapSeconds([]), null);
  assert.equal(medianSampleGapSeconds(["2026-05-31T10:00:00.000Z"]), null);
});

test("medianSampleGapSeconds computes median gap in seconds", () => {
  const gap = medianSampleGapSeconds([
    "2026-05-31T10:00:00.000Z",
    "2026-05-31T10:00:01.000Z",
    "2026-05-31T10:00:03.000Z",
  ]);

  assert.equal(gap, 2);
});
