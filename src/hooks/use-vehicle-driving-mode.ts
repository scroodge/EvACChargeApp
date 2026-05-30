"use client";

import { useMemo } from "react";

import { useDashboardDevSnapshotOverride } from "@/components/dev/dashboard-dev-snapshot-context";
import { useBydmateLiveQuery } from "@/hooks/use-bydmate-live-query";
import { useCarsQuery } from "@/hooks/use-cars-query";
import { useSessionsQuery } from "@/hooks/use-sessions-query";
import { useTickingClock } from "@/hooks/use-ticking-clock";
import { usePageVisible } from "@/hooks/use-page-visible";
import { deriveDashboardVehicleMode, resolveLiveSnapshotForVehicle } from "@/lib/vehicle-live-mode";
import { useAppPreferences } from "@/stores/use-app-preferences";

export function useVehicleDrivingMode() {
  const pageVisible = usePageVisible();
  const { data: liveRows } = useBydmateLiveQuery();
  const { data: carsResult } = useCarsQuery();
  const { data: sessions } = useSessionsQuery();
  const selectedCarId = useAppPreferences((s) => s.selectedCarId);

  const cars = carsResult?.cars;
  const preferredCarId = carsResult?.preferredCarId ?? null;
  const selectedCar =
    cars?.find((c) => c.id === selectedCarId) ??
    cars?.find((c) => c.id === preferredCarId) ??
    cars?.[0] ??
    null;
  const scopedVehicleId = selectedCar?.vehicle_alias ?? null;

  const baseSnapshot = useMemo(
    () => resolveLiveSnapshotForVehicle(liveRows ?? [], scopedVehicleId),
    [liveRows, scopedVehicleId],
  );
  const snapshot = useDashboardDevSnapshotOverride(baseSnapshot);

  const activeSession = useMemo(
    () =>
      sessions?.find(
        (s) => s.status === "charging" && (!selectedCar || s.car_id === selectedCar.id),
      ) ??
      sessions?.find((s) => s.status === "charging") ??
      null,
    [sessions, selectedCar],
  );

  const nowMs = useTickingClock(pageVisible);

  return (
    deriveDashboardVehicleMode({
      snapshot,
      nowMs,
      hasActiveSession: Boolean(activeSession),
    }) === "driving"
  );
}
