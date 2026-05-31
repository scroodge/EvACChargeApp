"use client";

import { useQuery } from "@tanstack/react-query";

import { devFetch, isDevAppRoute } from "@/lib/dev/dev-fetch";
import { usePageVisible } from "@/hooks/use-page-visible";
import { queryKeys } from "@/lib/query-keys";
import type { BydmateTripRow } from "@/types/database";

function localDateKeyFromIso(isoStr: string) {
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

async function fetchTripMonthDates(
  year: number,
  month: number,
  vehicleId: string | null,
): Promise<string[]> {
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const params = new URLSearchParams({ month: monthKey });
  if (vehicleId) params.set("vehicle_id", vehicleId);

  const path = `/api/vehicle/trips?${params.toString()}`;
  const response = isDevAppRoute()
    ? await devFetch(path)
    : await fetch(path);
  if (!response.ok) throw new Error("Failed to load trip dates");

  const payload = (await response.json()) as { startedAt?: string[] };
  const dates = [
    ...new Set((payload.startedAt ?? []).map((iso) => localDateKeyFromIso(iso))),
  ].sort();
  return dates;
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
    enabled: enabled && pageVisible,
    refetchInterval: pageVisible ? 15_000 : false,
  });
}

export function useTripMonthDatesQuery(
  year: number,
  month: number,
  vehicleId: string | null,
  enabled = true,
) {
  const pageVisible = usePageVisible();

  return useQuery({
    queryKey: queryKeys.bydmateTripMonthDates(year, month, vehicleId),
    queryFn: () => fetchTripMonthDates(year, month, vehicleId),
    enabled: enabled && pageVisible,
    staleTime: 60_000,
  });
}
