import { NextRequest, NextResponse } from "next/server";

import {
  fetchCostPerKm,
  fetchMonthlyStats,
  fetchPhantomDrain,
} from "@/lib/vehicle-analytics";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const type = params.get("type") ?? "monthly";
  const vehicleId = params.get("vehicle_id")?.trim() || null;

  try {
    if (type === "monthly") {
      const month = params.get("month") ?? new Date().toISOString().slice(0, 7);
      const stats = await fetchMonthlyStats({
        supabase,
        userId: userData.user.id,
        vehicleId,
        monthKey: month,
      });
      return NextResponse.json(stats);
    }

    if (type === "phantom") {
      if (!vehicleId) {
        return NextResponse.json({ error: "vehicle_id required" }, { status: 400 });
      }
      const days = Number(params.get("days") ?? "14");
      const rows = await fetchPhantomDrain({
        supabase,
        userId: userData.user.id,
        vehicleId,
        days: Number.isFinite(days) ? days : 14,
      });
      return NextResponse.json({ rows });
    }

    if (type === "cost-per-km") {
      const fromDate = params.get("from") ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const toDate = params.get("to") ?? new Date().toISOString().slice(0, 10);
      const summary = await fetchCostPerKm({
        supabase,
        userId: userData.user.id,
        vehicleId,
        fromDate,
        toDate,
      });
      return NextResponse.json(summary);
    }

    return NextResponse.json({ error: "Unknown analytics type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
