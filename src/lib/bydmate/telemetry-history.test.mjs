import test from "node:test";
import assert from "node:assert/strict";

import { resolveChargingSessionSampleWindow } from "./telemetry-session-window.ts";

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
