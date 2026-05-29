import type { SupabaseClient } from "@supabase/supabase-js";

/** BYDMate vehicle_id / cars.vehicle_alias used across dev routes. */
export const DEV_WAY_VEHICLE_ID = "way";

export type WayDevContext = {
  vehicleId: string;
  /** VoltFlow account that owns charging_sessions for this vehicle. */
  appUserId: string | null;
  /** cars.id rows with vehicle_alias matching vehicleId. */
  carIds: string[];
};

/**
 * Resolves the VoltFlow “way” car (vehicle_alias) for dev pages.
 * BYDMate rows may use a different user_id than the app account; sessions
 * must be loaded via car_id / app user, not live-snapshot user_id alone.
 */
export async function resolveWayDevContext(
  supabase: SupabaseClient,
  vehicleId: string = DEV_WAY_VEHICLE_ID,
): Promise<WayDevContext> {
  const { data: cars } = await supabase
    .from("cars")
    .select("id, user_id, vehicle_alias")
    .eq("vehicle_alias", vehicleId);

  const matched = cars ?? [];
  if (matched.length > 0) {
    return {
      vehicleId,
      appUserId: matched[0].user_id as string,
      carIds: matched.map((car) => car.id as string),
    };
  }

  const { data: liveRows } = await supabase
    .from("bydmate_live_snapshots")
    .select("user_id")
    .eq("vehicle_id", vehicleId)
    .order("received_at", { ascending: false })
    .limit(1);

  const fallbackUserId =
    (liveRows?.[0] as { user_id?: string } | undefined)?.user_id ?? null;

  return { vehicleId, appUserId: fallbackUserId, carIds: [] };
}

type SessionFilterQuery = {
  in(column: "car_id", values: string[]): SessionFilterQuery;
  eq(column: "user_id", value: string): SessionFilterQuery;
};

export function applyWaySessionFilter<Q extends SessionFilterQuery>(query: Q, ctx: WayDevContext): Q {
  if (ctx.carIds.length > 0) return query.in("car_id", ctx.carIds) as Q;
  if (ctx.appUserId) return query.eq("user_id", ctx.appUserId) as Q;
  return query;
}
