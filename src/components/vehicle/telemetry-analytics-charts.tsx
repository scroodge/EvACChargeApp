"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Maximize2 } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";
import type { Locale, TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  aggregateTelemetryBuckets,
  type AnalyticsSummary,
  type TelemetryBucket,
  type TempConsumptionBucket,
} from "@/lib/bydmate/telemetry-buckets";
import type { TelemetryHistoryPoint } from "@/lib/bydmate/telemetry-history";
import type { TelemetryHistoryRange } from "@/lib/bydmate/telemetry-ranges";
import type { RouteInsight } from "@/lib/bydmate/route-insights";

type Translator = (key: TranslationKey, values?: Record<string, string | number>) => string;

function fmt(value: number | null | undefined, digits = 1) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function localeCode(locale: Locale) {
  return locale === "be" ? "be-BY" : locale === "ru" ? "ru-RU" : "en-US";
}

type SummaryStat = {
  id: string;
  labelKey: TranslationKey;
  value: string;
  unit?: string;
  accent?: boolean;
};

export function AnalyticsSummaryStats({
  summary,
  chargedKwh,
}: {
  summary: AnalyticsSummary;
  chargedKwh?: number | null;
}) {
  const { t } = useTranslation();
  const tx = t as Translator;

  const rawItems: Array<SummaryStat | null> = [
    { id: "trips", labelKey: "vehicle.analytics.summary.trips", value: String(summary.tripCount) },
    {
      id: "distance",
      labelKey: "vehicle.analytics.summary.distance",
      value: fmt(summary.distanceKm, 0),
      unit: "km",
      accent: true,
    },
    {
      id: "regen",
      labelKey: "vehicle.analytics.summary.regen",
      value: fmt(summary.regenKwh, 2),
      unit: "kWh",
      accent: true,
    },
    chargedKwh != null
      ? {
          id: "charged",
          labelKey: "vehicle.analytics.charged",
          value: fmt(chargedKwh, 1),
          unit: "kWh",
        }
      : null,
    summary.avgConsumptionKwh100 != null
      ? {
          id: "consumption",
          labelKey: "vehicle.analytics.summary.consumption",
          value: fmt(summary.avgConsumptionKwh100, 1),
          unit: "kWh/100",
          accent: true,
        }
      : null,
    summary.maxSpeedKmh != null
      ? {
          id: "maxSpeed",
          labelKey: "vehicle.analytics.summary.maxSpeed",
          value: fmt(summary.maxSpeedKmh, 0),
          unit: "km/h",
        }
      : null,
    summary.socSwing != null
      ? {
          id: "socSwing",
          labelKey: "vehicle.analytics.summary.socSwing",
          value: fmt(summary.socSwing, 0),
          unit: "%",
        }
      : null,
    {
      id: "telemetry",
      labelKey: "vehicle.analytics.summary.telemetry",
      value: String(summary.telemetryPoints),
    },
  ];

  const items = rawItems.filter((item): item is SummaryStat => {
    if (item == null) return false;
    if (item.value === "—") return false;
    return true;
  });

  if (items.length === 0) return null;

  return (
    <section className="mt-4" aria-label={tx("vehicle.analytics.summaryTitle")}>
      <p className="mb-2.5 text-xs font-medium text-muted-foreground">{tx("vehicle.analytics.summaryTitle")}</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex min-h-[4.75rem] min-w-0 flex-col justify-between rounded-2xl border p-3",
              item.accent
                ? "border-primary/20 bg-primary/[0.06]"
                : "border-border bg-white/[0.02]",
            )}
          >
            <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{tx(item.labelKey)}</p>
            <p className="mt-2 font-heading text-xl font-bold leading-none tabular-nums tracking-tight">
              <span className="text-foreground">{item.value}</span>
              {item.unit ? (
                <span className="ml-1 text-[11px] font-semibold text-muted-foreground">{item.unit}</span>
              ) : null}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

type BarSeries = {
  label: string;
  color: string;
  values: number[];
};

type BarChartModel = {
  title: string;
  unit: string;
  valueDigits: number;
  labels: string[];
  series: BarSeries[];
  bandMin?: number[];
  bandMax?: number[];
};

function buildBarCharts(
  buckets: TelemetryBucket[],
  trips: { distance_km: number | null; avg_consumption_kwh_100km: number | null; started_at: string }[],
  range: TelemetryHistoryRange,
  locale: string,
  tx: Translator,
): BarChartModel[] {
  if (buckets.length === 0) return [];

  const labels = buckets.map((b) => b.label);

  const charts: BarChartModel[] = [
    {
      title: tx("vehicle.charts.regen"),
      unit: "kWh",
      valueDigits: 2,
      labels,
      series: [{ label: tx("vehicle.trips.regen"), color: "#34d399", values: buckets.map((b) => b.regenKwhSum) }],
    },
    {
      title: tx("vehicle.metrics.speed"),
      unit: "km/h",
      valueDigits: 0,
      labels,
      series: [{ label: tx("vehicle.metrics.speed"), color: "#7dd3fc", values: buckets.map((b) => b.speedMax ?? 0) }],
    },
    {
      title: tx("vehicle.metrics.power"),
      unit: "kW",
      valueDigits: 1,
      labels,
      series: [{ label: tx("vehicle.metrics.power"), color: "#facc15", values: buckets.map((b) => b.powerAvg ?? 0) }],
    },
    {
      title: tx("vehicle.charts.temperatures"),
      unit: "°C",
      valueDigits: 1,
      labels,
      series: [
        { label: tx("vehicle.charts.battery"), color: "#22c55e", values: buckets.map((b) => b.batteryTempAvg ?? 0) },
        { label: tx("vehicle.charts.outside"), color: "#38bdf8", values: buckets.map((b) => b.outsideTempAvg ?? 0) },
      ],
    },
  ];

  const socBand: BarChartModel = {
    title: tx("vehicle.charts.soc"),
    unit: "%",
    valueDigits: 0,
    labels,
    series: [],
    bandMin: buckets.map((b) => b.socMin ?? b.socLast ?? 0),
    bandMax: buckets.map((b) => b.socMax ?? b.socLast ?? 0),
  };
  charts.unshift(socBand);

  // Mileage + efficiency from trips grouped by bucket
  const granularity = range === "quarter" || range === "year" ? "week" : "day";
  const distanceByLabel = new Map<string, number>();
  const consumptionWeighted = new Map<string, { sum: number; weight: number }>();

  for (const trip of trips) {
    const ms = Date.parse(trip.started_at);
    if (!Number.isFinite(ms)) continue;
    const d = new Date(ms);
    let key: string;
    if (granularity === "week") {
      const day = d.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setUTCDate(d.getUTCDate() + diff);
      d.setUTCHours(0, 0, 0, 0);
      key = d.toLocaleDateString(locale, { month: "short", day: "numeric" });
    } else {
      key = d.toLocaleDateString(locale, { month: "short", day: "numeric" });
    }
    distanceByLabel.set(key, (distanceByLabel.get(key) ?? 0) + (trip.distance_km ?? 0));
    if (trip.avg_consumption_kwh_100km != null && trip.distance_km != null && trip.distance_km > 0) {
      const row = consumptionWeighted.get(key) ?? { sum: 0, weight: 0 };
      row.sum += trip.avg_consumption_kwh_100km * trip.distance_km;
      row.weight += trip.distance_km;
      consumptionWeighted.set(key, row);
    }
  }

  charts.push({
    title: tx("vehicle.analytics.mileageTitle"),
    unit: "km",
    valueDigits: 0,
    labels,
    series: [{
      label: tx("vehicle.trips.distance"),
      color: "var(--voltflow-cyan)",
      values: labels.map((label) => distanceByLabel.get(label) ?? 0),
    }],
  });

  charts.push({
    title: tx("vehicle.analytics.efficiencyTitle"),
    unit: "kWh/100",
    valueDigits: 1,
    labels,
    series: [{
      label: tx("vehicle.trips.consumption"),
      color: "#a78bfa",
      values: labels.map((label) => {
        const row = consumptionWeighted.get(label);
        return row && row.weight > 0 ? row.sum / row.weight : 0;
      }),
    }],
  });

  return charts.filter((chart) => {
    if (chart.bandMin && chart.bandMax) {
      return chart.bandMin.some((v) => v > 0) || chart.bandMax.some((v) => v > 0);
    }
    return chart.series.some((s) => s.values.some((v) => v > 0));
  });
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white/[0.03] text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export function TelemetryBarChart({ chart }: { chart: BarChartModel }) {
  const { t } = useTranslation();
  const tx = t as Translator;
  const [isOpen, setIsOpen] = useState(false);

  const { title, unit, valueDigits, labels, series, bandMin, bandMax } = chart;
  const count = labels.length;
  const hasBand = bandMin != null && bandMax != null;
  const allValues = [
    ...(hasBand ? [...bandMin, ...bandMax] : []),
    ...series.flatMap((s) => s.values),
  ].filter((v) => v > 0);
  const minValue = allValues.length ? Math.min(...allValues) : 0;
  const maxValue = allValues.length ? Math.max(...allValues) : 1;
  const pad = Math.max((maxValue - minValue) * 0.12, maxValue === minValue ? 1 : 0);
  const yMin = Math.max(0, minValue - pad);
  const yMax = maxValue + pad;

  const yScale = (value: number) => 104 - ((value - yMin) / (yMax - yMin)) * 88;
  const yTicks = [
    { label: fmt(yMax, valueDigits), value: yMax },
    { label: fmt((yMin + yMax) / 2, valueDigits), value: (yMin + yMax) / 2 },
    { label: fmt(yMin, valueDigits), value: yMin },
  ];

  const plot = (heightClass: string) => (
    <svg className={`${heightClass} w-full overflow-visible`} viewBox="0 0 340 158" role="img" aria-label={title}>
      <line x1="34" x2="318" y1="104" y2="104" stroke="currentColor" className="text-border" strokeWidth="1" />
      <line x1="34" x2="34" y1="16" y2="104" stroke="currentColor" className="text-border" strokeWidth="1" />
      {yTicks.map((tick, index) => (
        <g key={`${title}-y-${index}`}>
          <line
            x1="34"
            x2="318"
            y1={yScale(tick.value)}
            y2={yScale(tick.value)}
            stroke="currentColor"
            className="text-border/60"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <text x="29" y={yScale(tick.value) + 3} textAnchor="end" className="fill-muted-foreground text-[8px]">
            {tick.label}
          </text>
        </g>
      ))}
      {labels.map((label, index) => {
        const slotW = 284 / Math.max(count, 1);
        const cx = 34 + slotW * index + slotW / 2;
        const barW = Math.min(slotW * 0.55, 24);

        if (hasBand && bandMin && bandMax) {
          const minBand = bandMin[index] ?? 0;
          const maxBand = bandMax[index] ?? 0;
          const lo = yScale(minBand);
          const hi = yScale(maxBand);
          const bandTop = Math.min(lo, hi);
          return (
            <g key={`${title}-band-${label}`}>
              <rect
                x={cx - barW / 2}
                y={bandTop}
                width={barW}
                height={Math.abs(hi - lo) || 1}
                rx="2"
                fill="var(--voltflow-cyan)"
                fillOpacity="0.35"
              />
              {maxBand > 0 ? (
                <text x={cx} y={bandTop - 3} textAnchor="middle" className="fill-muted-foreground text-[7px]">
                  {fmt(minBand, valueDigits)}–{fmt(maxBand, valueDigits)}
                </text>
              ) : null}
              <text x={cx} y="124" textAnchor="middle" className="fill-muted-foreground text-[8px]">{label}</text>
            </g>
          );
        }

        return (
          <g key={`${title}-bar-${label}`}>
            {series.map((item, seriesIndex) => {
              const offset = (seriesIndex - (series.length - 1) / 2) * (barW / Math.max(series.length, 1));
              const value = item.values[index] ?? 0;
              const top = yScale(value);
              const barSliceW = barW / Math.max(series.length, 1) - 1;
              const barX = cx - barW / 2 + offset;
              const barCenterX = barX + barSliceW / 2;
              return (
                <g key={`${item.label}-${label}`}>
                  {value > 0 ? (
                    <rect
                      x={barX}
                      y={top}
                      width={barSliceW}
                      height={104 - top}
                      rx="2"
                      fill={item.color}
                      fillOpacity="0.85"
                    />
                  ) : null}
                  {value > 0 ? (
                    <text x={barCenterX} y={top - 3} textAnchor="middle" className="fill-foreground text-[7px] font-medium">
                      {fmt(value, valueDigits)}
                    </text>
                  ) : null}
                </g>
              );
            })}
            <text x={cx} y="124" textAnchor="middle" className="fill-muted-foreground text-[8px]">{label}</text>
          </g>
        );
      })}
      <text x="6" y="60" textAnchor="middle" transform="rotate(-90 6 60)" className="fill-muted-foreground text-[9px]">{unit}</text>
    </svg>
  );

  return (
    <article className="rounded-2xl border border-border bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {fmt(minValue, valueDigits)}–{fmt(maxValue, valueDigits)} {unit}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {series.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
          <IconButton label={tx("vehicle.charts.fullscreen")} onClick={() => setIsOpen(true)}>
            <Maximize2 className="size-4" aria-hidden />
          </IconButton>
        </div>
      </div>
      <div className="mt-4">{plot("h-44")}</div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] gap-3 p-3 sm:max-w-[calc(100vw-2rem)]">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <h3 className="font-heading text-xl font-semibold tracking-tight">{title}</h3>
          {plot("h-[60dvh]")}
        </DialogContent>
      </Dialog>
    </article>
  );
}

export function PhantomDrainBarChart({
  rows,
}: {
  rows: { date: string; drainPercent: number; idleHours: number }[];
}) {
  const { t } = useTranslation();
  const tx = t as Translator;
  if (rows.length === 0) return null;

  const chart: BarChartModel = {
    title: tx("vehicle.analytics.phantomTitle"),
    unit: "%",
    valueDigits: 1,
    labels: rows.map((r) => r.date.slice(5)),
    series: [{ label: tx("vehicle.analytics.phantomDrain"), color: "#fbbf24", values: rows.map((r) => r.drainPercent) }],
  };

  return <TelemetryBarChart chart={chart} />;
}

export function TempConsumptionBarChart({ buckets }: { buckets: TempConsumptionBucket[] }) {
  const { t } = useTranslation();
  const tx = t as Translator;
  if (buckets.length < 2) return null;

  const chart: BarChartModel = {
    title: tx("vehicle.analytics.consumptionVsTemp"),
    unit: "kWh/100",
    valueDigits: 1,
    labels: buckets.map((b) => b.tempLabel),
    series: [{ label: tx("vehicle.trips.consumption"), color: "#a78bfa", values: buckets.map((b) => b.avgConsumptionKwh100) }],
  };

  return <TelemetryBarChart chart={chart} />;
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
      {routes.map((route) => (
        <article key={route.routeId} className="rounded-2xl border border-border bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-heading text-base font-semibold tracking-tight">{route.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {tx("vehicle.analytics.routeTripCount", { value: route.tripCount })}
              </p>
            </div>
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
      ))}
    </div>
  );
}

export function useAnalyticsBarCharts(
  points: TelemetryHistoryPoint[],
  trips: { distance_km: number | null; avg_consumption_kwh_100km: number | null; started_at: string }[],
  range: TelemetryHistoryRange,
  locale: Locale,
  tx: Translator,
) {
  return useMemo(() => {
    if (range === "day") return [];
    const buckets = aggregateTelemetryBuckets(points, range, localeCode(locale));
    return buildBarCharts(buckets, trips, range, localeCode(locale), tx);
  }, [points, trips, range, locale, tx]);
}

export type { BarChartModel };
