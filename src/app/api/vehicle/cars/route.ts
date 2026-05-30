import { NextRequest, NextResponse } from "next/server";

import { resolveVehicleApiAccess } from "@/lib/dev/dev-api-auth";
import { DEV_WAY_VEHICLE_ID, resolveWayDevContext } from "@/lib/dev/way-context";
import { mapCar } from "@/lib/db-map";

export async function GET(request: NextRequest) {
  const access = await resolveVehicleApiAccess(request);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await access.supabase
    .from("cars")
    .select("*")
    .eq("user_id", access.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load cars" }, { status: 500 });
  }

  const way = access.devMode
    ? await resolveWayDevContext(access.supabase, DEV_WAY_VEHICLE_ID)
    : null;
  const preferredCarId = way?.carIds[0] ?? null;

  const cars = (data ?? []).map((row) => mapCar(row as Record<string, unknown>));
  if (preferredCarId) {
    cars.sort((a, b) => {
      if (a.id === preferredCarId) return -1;
      if (b.id === preferredCarId) return 1;
      return 0;
    });
  }

  return NextResponse.json({ cars, preferredCarId });
}
