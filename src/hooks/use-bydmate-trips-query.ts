"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { BydmateTripRow } from "@/types/database";

async function fetchBydmateTrips(date: string, vehicleId: string | null): Promise<BydmateTripRow[]> {
  const params = new URLSearchParams({ date });
  if (vehicleId) params.set("vehicle_id", vehicleId);

  const response = await fetch(`/api/vehicle/trips?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to load trips");

  const payload = (await response.json()) as { trips: BydmateTripRow[] };
  return payload.trips ?? [];
}

export function useBydmateTripsQuery(date: string, vehicleId: string | null) {
  return useQuery({
    queryKey: queryKeys.bydmateTrips(date, vehicleId),
    queryFn: () => fetchBydmateTrips(date, vehicleId),
    enabled: Boolean(date),
    refetchInterval: 15000,
  });
}
