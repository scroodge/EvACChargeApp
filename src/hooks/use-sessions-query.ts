"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { devFetch, isDevAppRoute } from "@/lib/dev/dev-fetch";
import { mapChargingSession } from "@/lib/db-map";
import { queryKeys } from "@/lib/query-keys";
import type { ChargingSessionRow } from "@/types/database";

export async function fetchSessions(): Promise<ChargingSessionRow[]> {
  if (isDevAppRoute()) {
    const response = await devFetch("/api/vehicle/sessions");
    if (!response.ok) return [];
    const payload = (await response.json()) as { sessions?: ChargingSessionRow[] };
    return payload.sessions ?? [];
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("charging_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((r) =>
    mapChargingSession(r as Record<string, unknown>),
  );
}

export function useSessionsQuery() {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: fetchSessions,
  });
}
