import { notFound } from "next/navigation";

import { createServiceClient } from "@/lib/supabase/service";
import { mapChargingSession } from "@/lib/db-map";
import { HistoryDevClient } from "./HistoryDevClient";
import type { BydmateTripRow } from "@/types/database";

export const dynamic = "force-dynamic";

const VEHICLE_ID = "way";

export default async function DevHistoryPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const supabase = createServiceClient();

  const [{ data: sessionRows }, { data: tripRows }] = await Promise.all([
    supabase
      .from("charging_sessions")
      .select("*")
      .not("started_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(100),
    supabase
      .from("bydmate_trips")
      .select("*")
      .eq("vehicle_id", VEHICLE_ID)
      .order("started_at", { ascending: false })
      .limit(100),
  ]);

  const sessions = (sessionRows ?? []).map((r) =>
    mapChargingSession(r as Record<string, unknown>),
  );
  const trips = (tripRows ?? []) as BydmateTripRow[];

  return (
    <main className="mx-auto max-w-lg">
      <HistoryDevClient sessions={sessions} trips={trips} />
    </main>
  );
}
