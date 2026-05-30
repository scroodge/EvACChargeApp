import { NextRequest, NextResponse } from "next/server";

import { fetchLifetimeTrackPoints } from "@/lib/vehicle-analytics";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicleId = request.nextUrl.searchParams.get("vehicle_id")?.trim();
  if (!vehicleId) {
    return NextResponse.json({ error: "vehicle_id required" }, { status: 400 });
  }

  try {
    const points = await fetchLifetimeTrackPoints({
      supabase,
      userId: userData.user.id,
      vehicleId,
    });
    return NextResponse.json({ vehicleId, points });
  } catch {
    return NextResponse.json({ error: "Failed to load lifetime map" }, { status: 500 });
  }
}
