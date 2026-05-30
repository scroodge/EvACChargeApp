"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { TelemetryHistoryCharts, RouteMap } from "@/components/vehicle/vehicle-live-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBydmateTelemetryHistoryQuery } from "@/hooks/use-bydmate-telemetry-history-query";
import { useTranslation } from "@/hooks/use-translation";
import { devFetch, isDevAppRoute, withDevApiParams } from "@/lib/dev/dev-fetch";
import type { TelemetryHistoryRange } from "@/lib/bydmate/telemetry-ranges";
import type { BydmateTripTrackPointRow } from "@/types/database";

const HISTORY_RANGES: TelemetryHistoryRange[] = ["day", "week", "month", "quarter", "year"];

function fmt(value: number | null | undefined, digits = 1) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";
}

async function fetchAnalytics<T>(path: string): Promise<T> {
  const response = isDevAppRoute()
    ? await devFetch(path)
    : await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load analytics");
  return response.json() as Promise<T>;
}

export function VehicleAnalyticsPanels({ vehicleId }: { vehicleId: string }) {
  const { t } = useTranslation();
  const [historyRange, setHistoryRange] = useState<TelemetryHistoryRange>("week");
  const [anchorDate, setAnchorDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [monthKey, setMonthKey] = useState(() => new Date().toISOString().slice(0, 7));
  const [costFrom, setCostFrom] = useState(() =>
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
  );
  const [costTo, setCostTo] = useState(() => new Date().toISOString().slice(0, 10));

  const historyQuery = useBydmateTelemetryHistoryQuery({
    range: historyRange,
    anchorDate,
    vehicleId,
  });

  const sohQuery = useBydmateTelemetryHistoryQuery({
    range: "year",
    anchorDate,
    vehicleId,
  });

  const monthlyQuery = useQuery({
    queryKey: ["vehicle-analytics", "monthly", monthKey, vehicleId],
    queryFn: () =>
      fetchAnalytics<{
        distanceKm: number;
        regenKwh: number;
        chargedKwh: number;
        chargingCost: number;
        sessionCount: number;
        tripCount: number;
        avgConsumptionKwh100: number | null;
      }>(`/api/vehicle/analytics?type=monthly&month=${monthKey}&vehicle_id=${encodeURIComponent(vehicleId)}`),
  });

  const phantomQuery = useQuery({
    queryKey: ["vehicle-analytics", "phantom", vehicleId],
    queryFn: () =>
      fetchAnalytics<{ rows: { date: string; drainPercent: number; idleHours: number }[] }>(
        `/api/vehicle/analytics?type=phantom&vehicle_id=${encodeURIComponent(vehicleId)}`,
      ),
  });

  const costQuery = useQuery({
    queryKey: ["vehicle-analytics", "cost", costFrom, costTo, vehicleId],
    queryFn: () =>
      fetchAnalytics<{ distanceKm: number; chargingCost: number; costPerKm: number | null }>(
        `/api/vehicle/analytics?type=cost-per-km&from=${costFrom}&to=${costTo}&vehicle_id=${encodeURIComponent(vehicleId)}`,
      ),
  });

  const mapQuery = useQuery({
    queryKey: ["vehicle-analytics", "lifetime-map", vehicleId],
    queryFn: () =>
      fetchAnalytics<{ points: BydmateTripTrackPointRow[] }>(
        `/api/vehicle/lifetime-map?vehicle_id=${encodeURIComponent(vehicleId)}`,
      ),
  });

  const sohPoints = useMemo(() => {
    return (sohQuery.data ?? [])
      .filter((point) => typeof point.telemetry.soh_percent === "number")
      .map((point) => ({
        device_time: point.device_time,
        telemetry: { soc: point.telemetry.soh_percent },
      }));
  }, [sohQuery.data]);

  const exportBase = `/api/vehicle/export?format=csv&vehicle_id=${encodeURIComponent(vehicleId)}&from=${costFrom}T00:00:00.000Z&to=${costTo}T23:59:59.999Z`;
  const exportUrl = isDevAppRoute() ? withDevApiParams(exportBase) : exportBase;

  return (
    <div className="grid gap-3">
      <section className="voltflow-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              {t("vehicle.analytics.historyTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("vehicle.analytics.historySubtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {HISTORY_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setHistoryRange(range)}
                className={
                  "rounded-full border px-3 py-1.5 text-sm capitalize transition " +
                  (historyRange === range
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40")
                }
              >
                {t(`vehicle.analytics.range.${range}`)}
              </button>
            ))}
          </div>
        </div>
        <label className="mt-4 grid gap-1 text-sm text-muted-foreground">
          {t("vehicle.trips.date")}
          <Input type="date" value={anchorDate} onChange={(event) => setAnchorDate(event.target.value)} className="w-44" />
        </label>
        <div className="mt-4">
          <TelemetryHistoryCharts
            points={historyQuery.data ?? []}
            isLoading={historyQuery.isLoading}
            hasError={Boolean(historyQuery.error)}
            embedded
          />
        </div>
      </section>

      <section className="voltflow-card p-5">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{t("vehicle.analytics.sohTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("vehicle.analytics.sohSubtitle")}</p>
        <div className="mt-4">
          <TelemetryHistoryCharts
            points={sohPoints}
            isLoading={sohQuery.isLoading}
            hasError={Boolean(sohQuery.error)}
            embedded
          />
        </div>
      </section>

      <section className="voltflow-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">{t("vehicle.analytics.monthlyTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("vehicle.analytics.monthlySubtitle")}</p>
          </div>
          <Input type="month" value={monthKey} onChange={(event) => setMonthKey(event.target.value)} className="w-44" />
        </div>
        {monthlyQuery.isLoading ? (
          <Skeleton className="mt-4 h-24 rounded-2xl" />
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 min-[430px]:grid-cols-3">
            <AnalyticsStat label={t("vehicle.analytics.trips") as string} value={String(monthlyQuery.data?.tripCount ?? 0)} />
            <AnalyticsStat label={t("vehicle.trips.distance") as string} value={`${fmt(monthlyQuery.data?.distanceKm, 0)} km`} />
            <AnalyticsStat label={t("vehicle.trips.regen") as string} value={`${fmt(monthlyQuery.data?.regenKwh, 2)} kWh`} />
            <AnalyticsStat label={t("vehicle.analytics.charged") as string} value={`${fmt(monthlyQuery.data?.chargedKwh, 1)} kWh`} />
            <AnalyticsStat label={t("vehicle.analytics.cost") as string} value={fmt(monthlyQuery.data?.chargingCost, 2)} />
            <AnalyticsStat
              label={t("vehicle.trips.consumption") as string}
              value={`${fmt(monthlyQuery.data?.avgConsumptionKwh100, 1)} kWh/100`}
            />
          </div>
        )}
      </section>

      <section className="voltflow-card p-5">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{t("vehicle.analytics.phantomTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("vehicle.analytics.phantomSubtitle")}</p>
        {phantomQuery.isLoading ? (
          <Skeleton className="mt-4 h-24 rounded-2xl" />
        ) : (phantomQuery.data?.rows.length ?? 0) === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("vehicle.analytics.phantomEmpty")}</p>
        ) : (
          <div className="mt-4 grid gap-2">
            {phantomQuery.data?.rows.slice(0, 7).map((row) => (
              <div
                key={row.date}
                className="flex items-center justify-between rounded-2xl border border-border bg-white/[0.02] px-4 py-3 text-sm"
              >
                <span>{row.date}</span>
                <span className="tabular-nums text-amber-200">-{fmt(row.drainPercent, 1)}%</span>
                <span className="text-muted-foreground">{fmt(row.idleHours, 0)} h idle</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="voltflow-card p-5">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{t("vehicle.analytics.costPerKmTitle")}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Input type="date" value={costFrom} onChange={(event) => setCostFrom(event.target.value)} className="w-40" />
          <Input type="date" value={costTo} onChange={(event) => setCostTo(event.target.value)} className="w-40" />
        </div>
        {costQuery.isLoading ? (
          <Skeleton className="mt-4 h-16 rounded-2xl" />
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <AnalyticsStat label={t("vehicle.trips.distance") as string} value={`${fmt(costQuery.data?.distanceKm, 0)} km`} />
            <AnalyticsStat label={t("vehicle.analytics.cost") as string} value={fmt(costQuery.data?.chargingCost, 2)} />
            <AnalyticsStat label={t("vehicle.analytics.costPerKm") as string} value={fmt(costQuery.data?.costPerKm, 3)} />
          </div>
        )}
      </section>

      <section className="voltflow-card p-5">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{t("vehicle.analytics.lifetimeMapTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("vehicle.analytics.lifetimeMapSubtitle")}</p>
        <div className="mt-4">
          <RouteMap
            trackPoints={mapQuery.data?.points ?? []}
            isLoading={mapQuery.isLoading}
            hasError={Boolean(mapQuery.error)}
            embedded
          />
        </div>
      </section>

      <section className="voltflow-card p-5">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{t("vehicle.analytics.exportTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("vehicle.analytics.exportSubtitle")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href={exportUrl} download>{t("vehicle.analytics.exportCsv")}</a>
          </Button>
          <Button asChild variant="outline">
            <a
              href={exportUrl.replace("format=csv", "format=json")}
              download
            >
              {t("vehicle.analytics.exportJson")}
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

function AnalyticsStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/[0.02] p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
