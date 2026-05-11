import type { ChargingSessionRow, Car, Profile } from "@/types/database";

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function mapCar(raw: Record<string, unknown>): Car {
  return {
    id: String(raw.id),
    user_id: String(raw.user_id),
    name: String(raw.name),
    battery_capacity_kwh: num(raw.battery_capacity_kwh),
    default_charger_power_kw: num(raw.default_charger_power_kw, 4.4),
    default_efficiency_percent: num(raw.default_efficiency_percent, 90),
    created_at: String(raw.created_at ?? ""),
  };
}

export function mapProfile(raw: Record<string, unknown>): Profile {
  return {
    id: String(raw.id),
    email: raw.email != null ? String(raw.email) : null,
    created_at: String(raw.created_at ?? ""),
  };
}

export function mapChargingSession(
  raw: Record<string, unknown>,
): ChargingSessionRow {
  return {
    id: String(raw.id),
    user_id: String(raw.user_id),
    car_id: String(raw.car_id),
    start_percent: num(raw.start_percent),
    current_percent: num(raw.current_percent),
    target_percent: num(raw.target_percent),
    battery_capacity_kwh: num(raw.battery_capacity_kwh),
    charger_power_kw: num(raw.charger_power_kw),
    efficiency_percent: num(raw.efficiency_percent),
    price_per_kwh: num(raw.price_per_kwh),
    charged_energy_kwh: num(raw.charged_energy_kwh),
    estimated_cost: num(raw.estimated_cost),
    status: raw.status as ChargingSessionRow["status"],
    started_at: raw.started_at ? String(raw.started_at) : null,
    stopped_at: raw.stopped_at ? String(raw.stopped_at) : null,
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  };
}
