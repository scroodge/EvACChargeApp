export type SessionStatus = "idle" | "charging" | "completed" | "stopped";

export type Profile = {
  id: string;
  email: string | null;
  created_at: string;
};

export type Car = {
  id: string;
  user_id: string;
  name: string;
  battery_capacity_kwh: number;
  default_charger_power_kw: number;
  default_efficiency_percent: number;
  created_at: string;
};

export type ChargingSessionRow = {
  id: string;
  user_id: string;
  car_id: string;
  start_percent: number;
  current_percent: number;
  target_percent: number;
  battery_capacity_kwh: number;
  charger_power_kw: number;
  efficiency_percent: number;
  price_per_kwh: number;
  charged_energy_kwh: number;
  estimated_cost: number;
  status: SessionStatus;
  started_at: string | null;
  stopped_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChargingSessionComputed = ChargingSessionRow & {
  derived: {
    currentPercent: number;
    chargedEnergyKwh: number;
    estimatedCost: number;
    elapsedSeconds: number;
    remainingSeconds: number;
    isComplete: boolean;
  };
};
