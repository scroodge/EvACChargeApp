import { NextRequest, NextResponse } from "next/server";

import { resolveVehicleApiAccess } from "@/lib/dev/dev-api-auth";
import { mapChargingSession } from "@/lib/db-map";

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const access = await resolveVehicleApiAccess(request);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const { data, error } = await access.supabase
    .from("charging_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", access.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    session: mapChargingSession(data as Record<string, unknown>),
  });
}
