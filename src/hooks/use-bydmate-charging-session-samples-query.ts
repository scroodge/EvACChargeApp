"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { BydmateDiplus, BydmateTelemetry } from "@/types/database";

export type ChargingSessionTelemetrySample = {
  device_time: string;
  telemetry: BydmateTelemetry;
  diplus?: BydmateDiplus;
  diplus_min_cell_voltage_v?: number | null;
  diplus_max_cell_voltage_v?: number | null;
  diplus_cell_delta_v?: number | null;
};

async function fetchChargingSessionSamples(
  sessionId: string,
  vehicleId: string,
): Promise<ChargingSessionTelemetrySample[]> {
  const params = new URLSearchParams({ vehicle_id: vehicleId });
  const response = await fetch(
    `/api/vehicle/charging-sessions/${sessionId}/samples?${params.toString()}`,
  );
  if (!response.ok) throw new Error("Failed to load charging samples");

  const payload = (await response.json()) as { points: ChargingSessionTelemetrySample[] };
  return payload.points ?? [];
}

export function useBydmateChargingSessionSamplesQuery(
  sessionId: string,
  vehicleId = "way",
) {
  return useQuery({
    queryKey: queryKeys.bydmateChargingSessionSamples(sessionId, vehicleId),
    queryFn: () => fetchChargingSessionSamples(sessionId, vehicleId),
    staleTime: 60_000,
  });
}
