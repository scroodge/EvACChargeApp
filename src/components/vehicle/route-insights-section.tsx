"use client";

import { RouteMapPreview } from "@/components/vehicle/vehicle-live-view";
import { TempConsumptionBarChart } from "@/components/vehicle/telemetry-analytics-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";
import type { TranslationKey } from "@/lib/i18n";
import { isRouteTrackDisplayable, type RouteInsight } from "@/lib/bydmate/route-insights";
import type { BydmateTripTrackPointRow } from "@/types/database";

type Translator = (key: TranslationKey, values?: Record<string, string | number>) => string;

function fmt(value: number | null | undefined, digits = 1) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";
}

export function RouteInsightsSection({
  routes,
  isLoading,
}: {
  routes: RouteInsight[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const tx = t as Translator;

  if (isLoading) {
    return <Skeleton className="h-32 rounded-2xl" />;
  }

  if (routes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{tx("vehicle.analytics.routeInsightsEmpty")}</p>
    );
  }

  return (
    <div id="route-insights" className="mt-4 grid gap-3">
      {routes.map((route) => {
        const showMap = isRouteTrackDisplayable(route.trackPoints);
        return (
        <article key={route.routeId} className="rounded-2xl border border-border bg-white/[0.02] p-4">
          {showMap ? (
            <RouteMapPreview
              trackPoints={route.trackPoints as BydmateTripTrackPointRow[]}
              className="h-44"
            />
          ) : null}
          <div className={`flex flex-wrap items-start justify-between gap-2 ${showMap ? "mt-3" : ""}`}>
            <p className="text-xs text-muted-foreground">
              {tx("vehicle.analytics.routeTripCount", { value: route.tripCount })}
            </p>
            {!route.unlocked ? (
              <span className="rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {tx("vehicle.analytics.routeUnlock", { value: route.tripsNeeded })}
              </span>
            ) : null}
          </div>
          {route.unlocked ? (
            <div className="mt-3 grid gap-2">
              <p className="text-sm tabular-nums">
                {fmt(route.medianConsumptionKwh100, 1)} kWh/100 · {fmt(route.minConsumptionKwh100, 1)}–{fmt(route.maxConsumptionKwh100, 1)}
              </p>
              {route.predictedConsumptionKwh100 ? (
                <p className="text-sm text-primary">
                  {tx("vehicle.analytics.routePrediction", {
                    low: fmt(route.predictedConsumptionKwh100.low, 1),
                    high: fmt(route.predictedConsumptionKwh100.high, 1),
                  })}
                </p>
              ) : null}
              {route.tempBuckets.length >= 2 ? (
                <TempConsumptionBarChart
                  buckets={route.tempBuckets.map((b) => ({
                    tempLabel: b.label,
                    tempMid: b.tempC,
                    tripCount: b.count,
                    avgConsumptionKwh100: b.avgConsumptionKwh100,
                  }))}
                />
              ) : null}
            </div>
          ) : null}
        </article>
        );
      })}
    </div>
  );
}
