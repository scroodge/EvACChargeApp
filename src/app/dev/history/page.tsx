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

  // Fetch trips for the "way" vehicle first — user_id comes from these rows
  const { data: tripRows } = await supabase
    .from("bydmate_trips")
    .select("*")
    .eq("vehicle_id", VEHICLE_ID)
    .order("started_at", { ascending: false })
    .limit(100);

  const trips = (tripRows ?? []) as BydmateTripRow[];
  const wayUserId = trips[0]?.user_id ?? null;

  // Filter sessions to the same user so we're always looking at "way" car data
  const sessionQuery = supabase
    .from("charging_sessions")
    .select("*")
    .not("started_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(100);

  const { data: sessionRows } = wayUserId
    ? await sessionQuery.eq("user_id", wayUserId)
    : await sessionQuery;

  const sessions = (sessionRows ?? []).map((r) =>
    mapChargingSession(r as Record<string, unknown>),
  );

  return (
    <main className="mx-auto max-w-lg">
      <HistoryDevClient sessions={sessions} trips={trips} />
    </main>
  );
}
