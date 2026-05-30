import { NextRequest, NextResponse } from "next/server";

import { resolveVehicleApiAccess } from "@/lib/dev/dev-api-auth";
import { mapChargingSession } from "@/lib/db-map";

export async function GET(request: NextRequest) {
  const access = await resolveVehicleApiAccess(request);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await access.supabase
    .from("charging_sessions")
    .select("*")
    .eq("user_id", access.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }

  const sessions = (data ?? []).map((row) =>
    mapChargingSession(row as Record<string, unknown>),
  );

  return NextResponse.json({ sessions });
}
