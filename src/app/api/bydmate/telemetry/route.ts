import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const telemetrySchema = z
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

const locationSchema = z
  .object({
    lat: z.number().nullable().optional(),
    lon: z.number().nullable().optional(),
    accuracy_m: z.number().nullable().optional(),
    bearing_deg: z.number().nullable().optional(),
  })
  .passthrough();

const payloadSchema = z
  .object({
    schema_version: z.literal(1),
    vehicle_id: z.string().min(1).max(160),
    device_time: z.string().min(1).max(80),
    source: z.literal("BYDMate"),
    telemetry: telemetrySchema,
    location: locationSchema,
  })
  .passthrough();

export async function POST(request: Request) {
  const expectedApiKey = process.env.BYDMATE_CLOUD_API_KEY;
  if (!expectedApiKey) {
    return Response.json({ ok: false, error: "Receiver is not configured" }, { status: 503 });
  }

  const apiKey = request.headers.get("x-api-key") ?? "";
  if (apiKey !== expectedApiKey) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const headerVehicleId = request.headers.get("x-vehicle-id")?.trim();
  if (!headerVehicleId) {
    return Response.json({ ok: false, error: "Missing X-Vehicle-Id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  if (payload.vehicle_id !== headerVehicleId) {
    return Response.json({ ok: false, error: "Vehicle ID mismatch" }, { status: 400 });
  }

  const receivedAt = new Date().toISOString();
  const deviceTime = new Date(payload.device_time);
  if (Number.isNaN(deviceTime.getTime())) {
    return Response.json({ ok: false, error: "Invalid device_time" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const snapshotRow = {
      vehicle_id: payload.vehicle_id,
      source: payload.source,
      schema_version: payload.schema_version,
      device_time: deviceTime.toISOString(),
      received_at: receivedAt,
      telemetry: payload.telemetry,
      location: payload.location,
      raw_payload: payload,
    };

    const { error: snapshotError } = await supabase
      .from("bydmate_live_snapshots")
      .upsert(snapshotRow, { onConflict: "vehicle_id" });

    if (snapshotError) {
      return Response.json({ ok: false, error: "Snapshot write failed" }, { status: 500 });
    }

    const { error: pointError } = await supabase.from("bydmate_telemetry_points").insert({
      ...snapshotRow,
    });

    if (pointError) {
      return Response.json({ ok: false, error: "History write failed" }, { status: 500 });
    }

    return Response.json({ ok: true, vehicle_id: payload.vehicle_id, received_at: receivedAt });
  } catch {
    return Response.json({ ok: false, error: "Receiver failed" }, { status: 500 });
  }
}
