import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateCumulativeRegenPoints,
  calculateTripEnergy,
} from "./trip-energy.ts";

function assertClose(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 0.001, `${actual} should be close to ${expected}`);
}

test("integrates negative power as recovered trip energy", () => {
  const summary = calculateTripEnergy([
    { device_time: "2026-05-26T10:00:00.000Z", power_kw: 10 },
    { device_time: "2026-05-26T10:01:00.000Z", power_kw: 20 },
    { device_time: "2026-05-26T10:02:00.000Z", power_kw: -12 },
    { device_time: "2026-05-26T10:03:00.000Z", power_kw: -18 },
  ]);

  assert.equal(summary.power_sample_count, 4);
  assertClose(summary.traction_energy_kwh, 0.354);
  assertClose(summary.regen_energy_kwh, 0.2875);
});

test("skips long telemetry gaps when integrating trip energy", () => {
  const summary = calculateTripEnergy([
    { device_time: "2026-05-26T10:00:00.000Z", power_kw: -30 },
    { device_time: "2026-05-26T10:10:00.000Z", power_kw: -30 },
  ]);

  assert.equal(summary.power_sample_count, 2);
  assert.equal(summary.regen_energy_kwh, 0);
});

test("builds cumulative recovered energy points", () => {
  const points = calculateCumulativeRegenPoints([
    { device_time: "2026-05-26T10:00:00.000Z", power_kw: -30 },
    { device_time: "2026-05-26T10:01:00.000Z", power_kw: -30 },
    { device_time: "2026-05-26T10:10:00.000Z", power_kw: 10 },
  ]);

  assert.equal(points.length, 3);
  assert.equal(points[1].value.toFixed(3), "0.500");
  assert.equal(points[2].value.toFixed(3), "0.500");
});
