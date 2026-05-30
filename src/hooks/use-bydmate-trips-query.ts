"use client";

import { useQuery } from "@tanstack/react-query";

import { devFetch, isDevAppRoute } from "@/lib/dev/dev-fetch";
import { usePageVisible } from "@/hooks/use-page-visible";
import { queryKeys } from "@/lib/query-keys";
import type { BydmateTripRow } from "@/types/database";

async function fetchBydmateTrips(date: string, vehicleId: string | null): Promise<BydmateTripRow[]> {
  const params = new URLSearchParams({ date });
  if (vehicleId) params.set("vehicle_id", vehicleId);

  const path = `/api/vehicle/trips?${params.toString()}`;
  const response = isDevAppRoute()
    ? await devFetch(path)
    : await fetch(path);
  if (!response.ok) throw new Error("Failed to load trips");

  const payload = (await response.json()) as { trips: BydmateTripRow[] };
  return payload.trips ?? [];
}

async function fetchLatestBydmateTrips(
  vehicleId: string | null,
  limit: number,
  lite: boolean,
): Promise<BydmateTripRow[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (vehicleId) params.set("vehicle_id", vehicleId);
  if (lite) params.set("lite", "1");

  const path = `/api/vehicle/trips?${params.toString()}`;
  const response = isDevAppRoute()
    ? await devFetch(path)
    : await fetch(path);
  if (!response.ok) throw new Error("Failed to load trips");

  const payload = (await response.json()) as { trips: BydmateTripRow[] };
  return payload.trips ?? [];
}

export function useBydmateTripsQuery(
  date: string,
  vehicleId: string | null,
  enabled = true,
) {
  const pageVisible = usePageVisible();

  return useQuery({
    queryKey: queryKeys.bydmateTrips(date, vehicleId),
    queryFn: () => fetchBydmateTrips(date, vehicleId),
    enabled: enabled && Boolean(date) && pageVisible,
    refetchInterval: pageVisible ? 15_000 : false,
  });
}

export function useLatestBydmateTripsQuery(
  vehicleId: string | null,
  limit = 1,
  enabled = true,
  lite = false,
) {
  const pageVisible = usePageVisible();

  return useQuery({
    queryKey: queryKeys.bydmateLatestTrips(vehicleId, limit, lite),
    queryFn: () => fetchLatestBydmateTrips(vehicleId, limit, lite),
    enabled: enabled && Boolean(vehicleId) && pageVisible,
    refetchInterval: pageVisible ? 15_000 : false,
  });
}
