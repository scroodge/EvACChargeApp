"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { BydmateTelemetry } from "@/types/database";

export type TripTelemetrySample = {
  device_time: string;
  telemetry: BydmateTelemetry;
};

async function fetchTripSamples(tripId: string): Promise<TripTelemetrySample[]> {
  const response = await fetch(`/api/vehicle/trips/${tripId}/samples`);
  if (!response.ok) throw new Error("Failed to load trip samples");

  const payload = (await response.json()) as { points: TripTelemetrySample[] };
  return payload.points ?? [];
}

export function useBydmateTripSamplesQuery(tripId: string | null) {
  return useQuery({
    queryKey: queryKeys.bydmateTripSamples(tripId ?? ""),
    queryFn: () => fetchTripSamples(tripId!),
    enabled: Boolean(tripId),
    staleTime: 60_000,
  });
}
