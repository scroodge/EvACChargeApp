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

async function fetchLatestBydmateTrips(
  vehicleId: string | null,
  limit: number,
): Promise<BydmateTripRow[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (vehicleId) params.set("vehicle_id", vehicleId);

  const response = await fetch(`/api/vehicle/trips?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to load trips");

  const payload = (await response.json()) as { trips: BydmateTripRow[] };
  return payload.trips ?? [];
}

export function useBydmateTripsQuery(
  date: string,
  vehicleId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.bydmateTrips(date, vehicleId),
    queryFn: () => fetchBydmateTrips(date, vehicleId),
    enabled: enabled && Boolean(date),
    refetchInterval: 15000,
  });
}

export function useLatestBydmateTripsQuery(
  vehicleId: string | null,
  limit = 1,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.bydmateLatestTrips(vehicleId, limit),
    queryFn: () => fetchLatestBydmateTrips(vehicleId, limit),
    enabled,
    refetchInterval: 15000,
  });
}
