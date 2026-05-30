import { NextRequest, NextResponse } from "next/server";

import { DEV_USER_EMAIL } from "@/lib/dev/way-context";
import { resolveVehicleApiAccess } from "@/lib/dev/dev-api-auth";
import { mapProfile } from "@/lib/db-map";

export async function GET(request: NextRequest) {
  const access = await resolveVehicleApiAccess(request);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await access.supabase
    .from("profiles")
    .select("*")
    .eq("id", access.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  return NextResponse.json({
    email: access.devMode ? DEV_USER_EMAIL : (data?.email as string | null) ?? null,
    profile: data ? mapProfile(data as Record<string, unknown>) : null,
  });
}
