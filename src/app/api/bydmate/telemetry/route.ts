import {
  locationSchema,
  normalizePayloads,
  telemetrySchema,
  type LocationPayload,
  type TelemetryPayload,
  type TelemetryPayloadData,
} from "@/lib/bydmate/ingest-payload";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const MAX_ACCEPTED_ACCURACY_M = 1000;
const MAX_REASONABLE_GPS_SPEED_KMH = 300;
const GPS_JUMP_TOLERANCE_KM = 0.2;
const MAX_GPS_JUMP_WINDOW_MS = 10 * 60 * 1000;
const MAX_TELEMETRY_JUMP_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_SOC_FAST_JUMP_WINDOW_MS = 6 * 60 * 60 * 1000;
const MAX_SOC_FAST_DELTA = 35;
const MAX_SOC_DAILY_DELTA = 70;
const MAX_ODOMETER_JUMP_KM_PER_HOUR = 300;
const ODOMETER_JUMP_TOLERANCE_KM = 5;

type AcceptedLocation = {
  lat: number;
  lon: number;
  deviceTimeMs: number;
};

type AcceptedTelemetry = {
  telemetry: TelemetryPayloadData;
  deviceTimeMs: number;
};

type NumericTelemetryRule = {
  min: number;
  max: number;
};

const numericTelemetryRules = {
  soc: { min: 0, max: 100 },
  speed_kmh: { min: 0, max: 260 },
  power_kw: { min: -250, max: 250 },
  battery_temp_c: { min: -50, max: 90 },
  cabin_temp_c: { min: -50, max: 90 },
  outside_temp_c: { min: -60, max: 70 },
  battery_voltage_v: { min: 0, max: 1000 },
  aux_voltage_v: { min: 6, max: 18 },
  odometer_km: { min: 0, max: 2_000_000 },
  soh_percent: { min: 0, max: 100 },
  charge_power_kw: { min: 0, max: 250 },
  kwh_charged: { min: 0, max: 500 },
  range_est_km: { min: 0, max: 1000 },
  current_trip_distance_km: { min: 0, max: 2000 },
  current_trip_consumption_kwh_100km: { min: 0, max: 80 },
} satisfies Partial<Record<keyof TelemetryPayloadData, NumericTelemetryRule>>;

const numericTelemetryKeys = Object.keys(numericTelemetryRules) as Array<
  keyof typeof numericTelemetryRules
>;

function finiteNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isWithinRule(value: number | null | undefined, rule: NumericTelemetryRule) {
  const n = finiteNumber(value);
  return n != null && n >= rule.min && n <= rule.max;
}

function hasPlausibleSocJump(
  previous: AcceptedTelemetry | undefined,
  nextSoc: number,
  deviceTimeMs: number,
) {
  const previousSoc = finiteNumber(previous?.telemetry.soc);
  if (previousSoc == null) return true;

  const elapsedMs = deviceTimeMs - previous!.deviceTimeMs;
  if (elapsedMs <= 0 || elapsedMs > MAX_TELEMETRY_JUMP_WINDOW_MS) return true;

  const delta = Math.abs(nextSoc - previousSoc);
  if (previousSoc <= 5 && nextSoc >= 20) return true;
  if (elapsedMs <= MAX_SOC_FAST_JUMP_WINDOW_MS) return delta <= MAX_SOC_FAST_DELTA;
  return delta <= MAX_SOC_DAILY_DELTA;
}

function hasPlausibleOdometerJump(
  previous: AcceptedTelemetry | undefined,
  nextOdometerKm: number,
  deviceTimeMs: number,
) {
  const previousOdometerKm = finiteNumber(previous?.telemetry.odometer_km);
  if (previousOdometerKm == null) return true;

  const elapsedMs = deviceTimeMs - previous!.deviceTimeMs;
  if (elapsedMs <= 0 || elapsedMs > MAX_TELEMETRY_JUMP_WINDOW_MS) {
    return nextOdometerKm >= previousOdometerKm - ODOMETER_JUMP_TOLERANCE_KM;
  }

  const deltaKm = nextOdometerKm - previousOdometerKm;
  if (deltaKm < -ODOMETER_JUMP_TOLERANCE_KM) return false;

  const elapsedHours = elapsedMs / (60 * 60 * 1000);
  const maxDistanceKm = MAX_ODOMETER_JUMP_KM_PER_HOUR * elapsedHours + ODOMETER_JUMP_TOLERANCE_KM;
  return deltaKm <= maxDistanceKm;
}

function sanitizeTelemetry(
  telemetry: TelemetryPayloadData,
  previous: AcceptedTelemetry | undefined,
  deviceTimeMs: number,
) {
  const sanitized: TelemetryPayloadData = { ...telemetry };
  let droppedFields = 0;

  for (const key of numericTelemetryKeys) {
    const value = telemetry[key];
    if (value == null) continue;

    if (!isWithinRule(value, numericTelemetryRules[key])) {
      delete sanitized[key];
      droppedFields += 1;
    }
  }

  const soc = finiteNumber(sanitized.soc);
  if (soc != null && !hasPlausibleSocJump(previous, soc, deviceTimeMs)) {
    delete sanitized.soc;
    droppedFields += 1;
  }

  const odometerKm = finiteNumber(sanitized.odometer_km);
  if (odometerKm != null && !hasPlausibleOdometerJump(previous, odometerKm, deviceTimeMs)) {
    delete sanitized.odometer_km;
    droppedFields += 1;
  }

  return { telemetry: sanitized, droppedFields };
}

function mergeAcceptedTelemetry(
  previous: TelemetryPayloadData | undefined,
  next: TelemetryPayloadData,
) {
  const merged: TelemetryPayloadData = { ...previous };
  for (const [key, value] of Object.entries(next) as Array<
    [keyof TelemetryPayloadData, TelemetryPayloadData[keyof TelemetryPayloadData]]
  >) {
    if (value != null) {
      merged[key] = value as never;
    }
  }

  return merged;
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

function sanitizePayloadTelemetry(
  payloads: TelemetryPayload[],
  previousTelemetry: Map<string, AcceptedTelemetry>,
) {
  let droppedTelemetryFields = 0;
  const ordered = payloads
    .map((payload, index) => ({
      payload,
      index,
      deviceTimeMs: Date.parse(payload.device_time),
    }))
    .sort((a, b) => a.deviceTimeMs - b.deviceTimeMs);

  const sanitized = [...payloads];
  for (const item of ordered) {
    const previous = previousTelemetry.get(item.payload.vehicle_id);
    const result = sanitizeTelemetry(item.payload.telemetry ?? {}, previous, item.deviceTimeMs);
    droppedTelemetryFields += result.droppedFields;

    sanitized[item.index] = {
      ...sanitized[item.index],
      telemetry: result.telemetry,
    };

    previousTelemetry.set(item.payload.vehicle_id, {
      telemetry: mergeAcceptedTelemetry(previous?.telemetry, result.telemetry),
      deviceTimeMs: item.deviceTimeMs,
    });
  }

  return { payloads: sanitized, droppedTelemetryFields };
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

function acceptedTelemetryFromSnapshot(row: {
  vehicle_id: string;
  device_time: string;
  telemetry: unknown;
}) {
  const parsed = telemetrySchema.safeParse(row.telemetry);
  if (!parsed.success) return null;

  const deviceTimeMs = Date.parse(row.device_time);
  if (!Number.isFinite(deviceTimeMs)) return null;

  return {
    vehicleId: row.vehicle_id,
    telemetry: {
      telemetry: parsed.data,
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
      .select("vehicle_id, device_time, telemetry, location")
      .eq("user_id", profile.id)
      .in("vehicle_id", vehicleIds);

    if (previousError) {
      return Response.json({ ok: false, error: "Previous telemetry lookup failed" }, { status: 500 });
    }

    const previousLocations = new Map<string, AcceptedLocation>();
    const previousTelemetry = new Map<string, AcceptedTelemetry>();
    for (const row of previousRows ?? []) {
      const accepted = acceptedLocationFromSnapshot(row);
      if (accepted) previousLocations.set(accepted.vehicleId, accepted.location);

      const telemetry = acceptedTelemetryFromSnapshot(row);
      if (telemetry) previousTelemetry.set(telemetry.vehicleId, telemetry.telemetry);
    }

    const { payloads: locationSanitizedSamples, droppedLocations } = sanitizePayloadLocations(
      normalizedSamples,
      previousLocations,
    );
    const { payloads: samples, droppedTelemetryFields } = sanitizePayloadTelemetry(
      locationSanitizedSamples,
      previousTelemetry,
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
            p_diplus: samples[0].diplus ?? {},
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
      dropped_telemetry_field_count: droppedTelemetryFields,
      received_at: receivedAt,
      ingest: ingestResult,
    });
  } catch {
    return Response.json({ ok: false, error: "Receiver failed" }, { status: 500 });
  }
}
