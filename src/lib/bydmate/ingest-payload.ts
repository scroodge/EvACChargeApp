import { z } from "zod";

export const telemetrySchema = z
  .object({
    soc: z.number().nullable().optional(),
    speed_kmh: z.number().nullable().optional(),
    power_kw: z.number().nullable().optional(),
    battery_temp_c: z.number().nullable().optional(),
    cabin_temp_c: z.number().nullable().optional(),
    outside_temp_c: z.number().nullable().optional(),
    battery_voltage_v: z.number().nullable().optional(),
    aux_voltage_v: z.number().nullable().optional(),
    odometer_km: z.number().nullable().optional(),
    soh_percent: z.number().nullable().optional(),
    is_charging: z.boolean().nullable().optional(),
    charge_power_kw: z.number().nullable().optional(),
    charge_type: z.string().nullable().optional(),
    kwh_charged: z.number().nullable().optional(),
    range_est_km: z.number().nullable().optional(),
    current_trip_distance_km: z.number().nullable().optional(),
    current_trip_consumption_kwh_100km: z.number().nullable().optional(),
  })
  .passthrough();

export const diplusSchema = z
  .object({
    soc: z.number().nullable().optional(),
    speed_kmh: z.number().nullable().optional(),
    mileage_km: z.number().nullable().optional(),
    power_kw: z.number().nullable().optional(),
    charge_gun_state: z.string().nullable().optional(),
    charging_status: z.string().nullable().optional(),
    battery_capacity_kwh: z.number().nullable().optional(),
    total_elec_consumption_kwh: z.number().nullable().optional(),
    voltage_12v: z.number().nullable().optional(),
    max_cell_voltage_v: z.number().nullable().optional(),
    min_cell_voltage_v: z.number().nullable().optional(),
    cell_delta_v: z.number().nullable().optional(),
    avg_battery_temp_c: z.number().nullable().optional(),
    exterior_temp_c: z.number().nullable().optional(),
    gear: z.string().nullable().optional(),
    power_state: z.string().nullable().optional(),
    inside_temp_c: z.number().nullable().optional(),
    ac_status: z.union([z.string(), z.boolean()]).nullable().optional(),
    ac_temp_c: z.number().nullable().optional(),
    fan_level: z.number().nullable().optional(),
    door_fl: z.union([z.string(), z.boolean()]).nullable().optional(),
    door_fr: z.union([z.string(), z.boolean()]).nullable().optional(),
    door_rl: z.union([z.string(), z.boolean()]).nullable().optional(),
    door_rr: z.union([z.string(), z.boolean()]).nullable().optional(),
    window_fl_percent: z.number().nullable().optional(),
    window_fr_percent: z.number().nullable().optional(),
    window_rl_percent: z.number().nullable().optional(),
    window_rr_percent: z.number().nullable().optional(),
    sunroof_percent: z.number().nullable().optional(),
    trunk: z.union([z.string(), z.boolean()]).nullable().optional(),
    hood: z.union([z.string(), z.boolean()]).nullable().optional(),
    tire_press_fl_kpa: z.number().nullable().optional(),
    tire_press_fr_kpa: z.number().nullable().optional(),
    tire_press_rl_kpa: z.number().nullable().optional(),
    tire_press_rr_kpa: z.number().nullable().optional(),
    drive_mode: z.string().nullable().optional(),
    work_mode: z.string().nullable().optional(),
    auto_park: z.union([z.string(), z.boolean()]).nullable().optional(),
    rain: z.union([z.string(), z.boolean()]).nullable().optional(),
    light_low: z.union([z.string(), z.boolean()]).nullable().optional(),
    drl: z.union([z.string(), z.boolean()]).nullable().optional(),
  })
  .passthrough();

export const locationSchema = z
  .object({
    lat: z.number().nullable().optional(),
    lon: z.number().nullable().optional(),
    accuracy_m: z.number().nullable().optional(),
    bearing_deg: z.number().nullable().optional(),
  })
  .passthrough();

export const payloadSchema = z
  .object({
    schema_version: z.literal(1),
    vehicle_id: z.string().min(1).max(160),
    device_time: z.string().min(1).max(80),
    source: z.literal("BYDMate"),
    telemetry: telemetrySchema,
    diplus: diplusSchema.optional(),
    location: locationSchema,
  })
  .passthrough();

const batchPayloadSchema = z.union([
  z.array(payloadSchema).min(1).max(300),
  z
    .object({
      samples: z.array(payloadSchema).min(1).max(300),
    })
    .passthrough(),
]);

export type TelemetryPayload = z.infer<typeof payloadSchema>;
export type LocationPayload = z.infer<typeof locationSchema>;
export type TelemetryPayloadData = z.infer<typeof telemetrySchema>;
export type DiplusPayloadData = z.infer<typeof diplusSchema>;

export function normalizePayloads(json: unknown) {
  const batchParsed = batchPayloadSchema.safeParse(json);
  if (batchParsed.success) {
    return {
      success: true as const,
      payloads: Array.isArray(batchParsed.data) ? batchParsed.data : batchParsed.data.samples,
    };
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return {
      success: false as const,
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  return {
    success: true as const,
    payloads: [parsed.data],
  };
}
