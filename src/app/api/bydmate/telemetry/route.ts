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

const batchPayloadSchema = z.union([
  z.array(payloadSchema).min(1).max(300),
  z
    .object({
      samples: z.array(payloadSchema).min(1).max(300),
    })
    .passthrough(),
]);

type TelemetryPayload = z.infer<typeof payloadSchema>;
type LocationPayload = z.infer<typeof locationSchema>;

const MAX_ACCEPTED_ACCURACY_M = 1000;
const MAX_REASONABLE_GPS_SPEED_KMH = 300;
const GPS_JUMP_TOLERANCE_KM = 0.2;
const MAX_GPS_JUMP_WINDOW_MS = 10 * 60 * 1000;

type AcceptedLocation = {
  lat: number;
  lon: number;
  deviceTimeMs: number;
};

function normalizePayloads(json: unknown) {
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

function finiteNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeBearing(value: number | null | undefined) {
  const bearing = finiteNumber(value);
  if (bearing == null) return null;
  return ((bearing % 360) + 360) % 360;
}

function normalizeAccuracy(value: number | null | undefined) {
  const accuracy = finiteNumber(value);
  if (accuracy == null || accuracy < 0 || accuracy > MAX_ACCEPTED_ACCURACY_M) return null;
  return accuracy;
}

function hasPlausibleCoordinates(location: LocationPayload) {
  const lat = finiteNumber(location.lat);
  const lon = finiteNumber(location.lon);
  if (lat == null || lon == null) return false;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
  if (lat === 0 && lon === 0) return false;

  const accuracy = finiteNumber(location.accuracy_m);
  if (accuracy != null && (accuracy < 0 || accuracy > MAX_ACCEPTED_ACCURACY_M)) return false;

  return true;
}

function distanceKm(from: Pick<AcceptedLocation, "lat" | "lon">, to: Pick<AcceptedLocation, "lat" | "lon">) {
  const earthRadiusKm = 6371;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLon = ((to.lon - from.lon) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hasPlausibleJump(previous: AcceptedLocation | undefined, next: AcceptedLocation) {
  if (!previous) return true;

  const elapsedMs = next.deviceTimeMs - previous.deviceTimeMs;
  if (elapsedMs <= 0 || elapsedMs > MAX_GPS_JUMP_WINDOW_MS) return true;

  const elapsedHours = elapsedMs / (60 * 60 * 1000);
  const maxDistanceKm = MAX_REASONABLE_GPS_SPEED_KMH * elapsedHours + GPS_JUMP_TOLERANCE_KM;
  return distanceKm(previous, next) <= maxDistanceKm;
}

function withoutCoordinates(location: LocationPayload) {
  const rest: LocationPayload = { ...location };
  delete rest.lat;
  delete rest.lon;
  delete rest.accuracy_m;
  delete rest.bearing_deg;
  return rest;
}

function sanitizeLocation(location: LocationPayload, previous: AcceptedLocation | undefined, deviceTimeMs: number) {
  if (!hasPlausibleCoordinates(location)) {
    return { location: withoutCoordinates(location), accepted: null };
  }

  const accepted = {
    lat: location.lat!,
    lon: location.lon!,
    deviceTimeMs,
  };

  if (!hasPlausibleJump(previous, accepted)) {
    return { location: withoutCoordinates(location), accepted: null };
  }

  return {
    location: {
      ...location,
      lat: accepted.lat,
      lon: accepted.lon,
      accuracy_m: normalizeAccuracy(location.accuracy_m),
      bearing_deg: normalizeBearing(location.bearing_deg),
    },
    accepted,
  };
}

function sanitizePayloadLocations(
  payloads: TelemetryPayload[],
  previousLocations: Map<string, AcceptedLocation>,
) {
  let droppedLocations = 0;
  const ordered = payloads
    .map((payload, index) => ({
      payload,
      index,
      deviceTimeMs: Date.parse(payload.device_time),
    }))
    .sort((a, b) => a.deviceTimeMs - b.deviceTimeMs);

  const sanitized = [...payloads];
  for (const item of ordered) {
    const previous = previousLocations.get(item.payload.vehicle_id);
    const result = sanitizeLocation(item.payload.location ?? {}, previous, item.deviceTimeMs);

    if (result.accepted) {
      previousLocations.set(item.payload.vehicle_id, result.accepted);
    } else if (item.payload.location?.lat != null || item.payload.location?.lon != null) {
      droppedLocations += 1;
    }

    sanitized[item.index] = {
      ...item.payload,
      location: result.location,
    };
  }

  return { payloads: sanitized, droppedLocations };
}

function acceptedLocationFromSnapshot(row: {
  vehicle_id: string;
  device_time: string;
  location: unknown;
}) {
  const parsed = locationSchema.safeParse(row.location);
  if (!parsed.success || !hasPlausibleCoordinates(parsed.data)) return null;

  const deviceTimeMs = Date.parse(row.device_time);
  if (!Number.isFinite(deviceTimeMs)) return null;

  return {
    vehicleId: row.vehicle_id,
    location: {
      lat: parsed.data.lat!,
      lon: parsed.data.lon!,
      deviceTimeMs,
    },
  };
}

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key") ?? "";
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

  const normalized = normalizePayloads(json);
  if (!normalized.success) {
    return Response.json(
      { ok: false, error: "Invalid payload", issues: normalized.issues },
      { status: 400 },
    );
  }

  const payloads = normalized.payloads;
  const mismatchedPayload = payloads.find((payload) => payload.vehicle_id !== headerVehicleId);
  if (mismatchedPayload) {
    return Response.json({ ok: false, error: "Vehicle ID mismatch" }, { status: 400 });
  }

  const receivedAt = new Date().toISOString();
  const parsedSamples = payloads.map((payload) => ({
    payload,
    deviceTime: new Date(payload.device_time),
  }));

  if (parsedSamples.some((sample) => Number.isNaN(sample.deviceTime.getTime()))) {
    return Response.json({ ok: false, error: "Invalid device_time" }, { status: 400 });
  }

  const normalizedSamples = parsedSamples.map(({ payload, deviceTime }) => ({
    ...payload,
    device_time: deviceTime.toISOString(),
  }));

  try {
    const supabase = createServiceClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("bydmate_cloud_api_key", apiKey)
      .maybeSingle();

    if (profileError) {
      return Response.json({ ok: false, error: "Key lookup failed" }, { status: 500 });
    }

    if (!profile?.id) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const vehicleIds = Array.from(new Set(normalizedSamples.map((sample) => sample.vehicle_id)));
    const { data: previousRows, error: previousError } = await supabase
      .from("bydmate_live_snapshots")
      .select("vehicle_id, device_time, location")
      .eq("user_id", profile.id)
      .in("vehicle_id", vehicleIds);

    if (previousError) {
      return Response.json({ ok: false, error: "Location lookup failed" }, { status: 500 });
    }

    const previousLocations = new Map<string, AcceptedLocation>();
    for (const row of previousRows ?? []) {
      const accepted = acceptedLocationFromSnapshot(row);
      if (accepted) previousLocations.set(accepted.vehicleId, accepted.location);
    }

    const { payloads: samples, droppedLocations } = sanitizePayloadLocations(
      normalizedSamples,
      previousLocations,
    );

    const { data: ingestResult, error: ingestError } =
      samples.length === 1
        ? await supabase.rpc("bydmate_ingest_telemetry", {
            p_user_id: profile.id,
            p_vehicle_id: samples[0].vehicle_id,
            p_source: samples[0].source,
            p_schema_version: samples[0].schema_version,
            p_device_time: samples[0].device_time,
            p_received_at: receivedAt,
            p_telemetry: samples[0].telemetry,
            p_location: samples[0].location ?? {},
            p_raw_payload: samples[0],
          })
        : await supabase.rpc("bydmate_ingest_telemetry_batch", {
            p_user_id: profile.id,
            p_received_at: receivedAt,
            p_samples: samples,
          });

    if (ingestError) {
      return Response.json({ ok: false, error: "Telemetry ingest failed" }, { status: 500 });
    }

    return Response.json({
      ok: true,
      vehicle_id: headerVehicleId,
      sample_count: samples.length,
      dropped_location_count: droppedLocations,
      received_at: receivedAt,
      ingest: ingestResult,
    });
  } catch {
    return Response.json({ ok: false, error: "Receiver failed" }, { status: 500 });
  }
}
