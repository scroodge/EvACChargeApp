import { NextResponse } from "next/server";

import { sanitizeTripTrackPoints } from "@/lib/bydmate/telemetry-sanitizer";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ tripId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { tripId } = await context.params;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: trip, error: tripError } = await supabase
    .from("bydmate_trips")
    .select("id")
    .eq("id", tripId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("bydmate_trip_track_points")
    .select("device_time, lat, lon, accuracy_m, bearing_deg, speed_kmh, power_kw, soc")
    .eq("trip_id", tripId)
    .eq("user_id", userData.user.id)
    .order("device_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load trip track" }, { status: 500 });
  }

  const track = sanitizeTripTrackPoints(data ?? []);

  return NextResponse.json({
    tripId,
    points: track.points,
    droppedPointCount: track.droppedPointCount,
  });
}
