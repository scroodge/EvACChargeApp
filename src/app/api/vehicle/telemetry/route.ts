import { NextRequest, NextResponse } from "next/server";

import { fetchTelemetryHistory } from "@/lib/bydmate/telemetry-history";
import { parseTelemetryRange } from "@/lib/bydmate/telemetry-ranges";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const range = parseTelemetryRange(params.get("range"));
  const anchorDate = params.get("date") ?? new Date().toISOString().slice(0, 10);
  const vehicleId = params.get("vehicle_id")?.trim() || null;

  try {
    const points = await fetchTelemetryHistory({
      supabase,
      userId: userData.user.id,
      vehicleId,
      range,
      anchorDate,
    });

    return NextResponse.json({ range, anchorDate, points });
  } catch {
    return NextResponse.json({ error: "Failed to load telemetry history" }, { status: 500 });
  }
}
