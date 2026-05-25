import test from "node:test";
import assert from "node:assert/strict";

import { estimateVehicleRangeKm } from "./range-estimate.ts";

const baseSnapshot = {
  id: "live",
  vehicle_id: "way",
  user_id: "user",
  source: "BYDMate",
  schema_version: 1,
  device_time: "2026-05-25T18:00:00.000Z",
  received_at: "2026-05-25T18:00:00.000Z",
  telemetry: {
    soc: 100,
    speed_kmh: 0,
    range_est_km: 122,
  },
  location: {},
  raw_payload: {},
  updated_at: "2026-05-25T18:00:00.000Z",
};

test("does not let a low reported range dominate a full-battery estimate", () => {
  const estimate = estimateVehicleRangeKm(baseSnapshot, []);

  assert.ok(estimate.estimatedRangeKm > 180);
  assert.ok(estimate.estimatedRangeKm < 260);
});
