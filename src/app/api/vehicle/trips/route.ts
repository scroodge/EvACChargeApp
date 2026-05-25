import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const date = params.get("date");
  const vehicleId = params.get("vehicle_id")?.trim();
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 1) || 1, 1), 20);

  if (!date) {
    let latestQuery = supabase
      .from("bydmate_trips")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (vehicleId) {
      latestQuery = latestQuery.eq("vehicle_id", vehicleId);
    }

    const { data, error } = await latestQuery;
    if (error) {
      return NextResponse.json({ error: "Failed to load trips" }, { status: 500 });
    }

    return NextResponse.json({ trips: data ?? [] });
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  let query = supabase
    .from("bydmate_trips")
    .select("*")
    .eq("user_id", userData.user.id)
    .lte("started_at", dayEnd)
    .or(`ended_at.is.null,ended_at.gte.${dayStart}`)
    .order("started_at", { ascending: false });

  if (vehicleId) {
    query = query.eq("vehicle_id", vehicleId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to load trips" }, { status: 500 });
  }

  return NextResponse.json({ date, trips: data ?? [] });
}
