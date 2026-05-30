"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { devFetch, isDevAppRoute } from "@/lib/dev/dev-fetch";
import { createClient } from "@/lib/supabase/client";
import { mapChargingSession } from "@/lib/db-map";
import { queryKeys } from "@/lib/query-keys";
import type { ChargingSessionRow } from "@/types/database";

export async function fetchSessionById(
  sessionId: string,
): Promise<ChargingSessionRow> {
  if (isDevAppRoute()) {
    const response = await devFetch(`/api/vehicle/session/${sessionId}?dev=1`);
    if (!response.ok) throw new Error("Unauthorized");
    const payload = (await response.json()) as { session: ChargingSessionRow };
    return payload.session;
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("charging_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (error) throw error;

  return mapChargingSession(data as Record<string, unknown>);
}

export function useSessionQuery(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.session(sessionId),
    queryFn: () => fetchSessionById(sessionId),
    enabled: Boolean(sessionId),
  });
}

export function usePrefetchSession() {
  const qc = useQueryClient();
  return (sessionId: string) =>
    qc.prefetchQuery({
      queryKey: queryKeys.session(sessionId),
      queryFn: () => fetchSessionById(sessionId),
    });
}
