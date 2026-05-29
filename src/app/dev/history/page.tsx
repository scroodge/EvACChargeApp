import { notFound } from "next/navigation";

import { createServiceClient } from "@/lib/supabase/service";
import { mapChargingSession } from "@/lib/db-map";
import { calculateTripEnergy } from "@/lib/bydmate/trip-energy";
import { isStationaryChargingLikeTrip } from "@/lib/bydmate/trip-filter";
import { HistoryDevClient } from "./HistoryDevClient";
import type { BydmateTelemetry, BydmateTripRow } from "@/types/database";

export const dynamic = "force-dynamic";

const VEHICLE_ID = "way";

export default async function DevHistoryPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const supabase = createServiceClient();

  // Fetch trips for the "way" vehicle first — user_id comes from these rows
  const { data: tripRows } = await supabase
    .from("bydmate_trips")
    .select("*")
    .eq("vehicle_id", VEHICLE_ID)
    .order("started_at", { ascending: false })
    .limit(100);

  const rawTrips = (tripRows ?? []) as BydmateTripRow[];
  const wayUserId = rawTrips[0]?.user_id ?? null;

  // Compute regen/traction energy from telemetry samples (same as /api/vehicle/trips)
  let trips = rawTrips;
  if (rawTrips.length > 0 && wayUserId) {
    const tripEndTime = (t: BydmateTripRow) => t.ended_at ?? t.last_device_time;
    const from = rawTrips.reduce((min, t) => (Date.parse(t.started_at) < Date.parse(min) ? t.started_at : min), rawTrips[0].started_at);
    const to = rawTrips.reduce((max, t) => (Date.parse(tripEndTime(t)) > Date.parse(max) ? tripEndTime(t) : max), tripEndTime(rawTrips[0]));

    // Fetch descending so the most recent 10000 samples cover recent trips first
    const { data: sampleRows } = await supabase
      .from("bydmate_telemetry_samples")
      .select("vehicle_id, device_time, telemetry")
      .eq("user_id", wayUserId)
      .eq("vehicle_id", VEHICLE_ID)
      .gte("device_time", from)
      .lte("device_time", to)
      .order("device_time", { ascending: false })
      .limit(10000);

    const samples = (sampleRows ?? []) as { vehicle_id: string; device_time: string; telemetry: BydmateTelemetry }[];
    const samplesByTrip = new Map<string, typeof samples>();
    for (const sample of samples) {
      const sampleMs = Date.parse(sample.device_time);
      if (!Number.isFinite(sampleMs)) continue;
      const trip = rawTrips.find((c) => c.vehicle_id === sample.vehicle_id && sampleMs >= Date.parse(c.started_at) && sampleMs <= Date.parse(tripEndTime(c)));
      if (!trip) continue;
      const rows = samplesByTrip.get(trip.id) ?? [];
      rows.push(sample);
      samplesByTrip.set(trip.id, rows);
    }

    trips = rawTrips.flatMap((trip) => {
      // Reverse to restore chronological order (samples were fetched descending)
      const points = (samplesByTrip.get(trip.id) ?? []).slice().reverse().map((s) => ({ device_time: s.device_time, power_kw: s.telemetry?.power_kw, speed_kmh: s.telemetry?.speed_kmh, current_trip_distance_km: s.telemetry?.current_trip_distance_km }));
      if (isStationaryChargingLikeTrip(trip, points)) return [];
      return [{ ...trip, ...calculateTripEnergy(points) }];
    });
  }

  // Filter sessions to the same user so we're always looking at "way" car data
  const sessionQuery = supabase
    .from("charging_sessions")
    .select("*")
    .not("started_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(100);

  const { data: sessionRows } = wayUserId
    ? await sessionQuery.eq("user_id", wayUserId)
    : await sessionQuery;

  const sessions = (sessionRows ?? []).map((r) =>
    mapChargingSession(r as Record<string, unknown>),
  );

  return (
    <main className="mx-auto max-w-lg">
      <HistoryDevClient sessions={sessions} trips={trips} />
    </main>
  );
}
