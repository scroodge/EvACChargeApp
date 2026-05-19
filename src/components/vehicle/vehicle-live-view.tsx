"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BatteryCharging,
  CarFront,
  ChevronDown,
  ChevronRight,
  Clock3,
  Gauge,
  MapPin,
  Route,
  Thermometer,
  Zap,
} from "lucide-react";

import { BrandBadge } from "@/components/brand/BrandBadge";
import { LogoFull } from "@/components/brand/LogoFull";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBydmateLiveQuery } from "@/hooks/use-bydmate-live-query";
import { useBydmateTelemetryPointsQuery } from "@/hooks/use-bydmate-telemetry-points-query";
import { useTickingClock } from "@/hooks/use-ticking-clock";
import type {
  BydmateLiveSnapshotRow,
  BydmateTelemetry,
  BydmateTelemetryPointRow,
} from "@/types/database";

function fmt(value: number | null | undefined, digits = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function fmtBool(value: boolean | null | undefined) {
  if (value == null) return "—";
  return value ? "Yes" : "No";
}

function fmtTemp(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < -50 || value > 90) {
    return "—";
  }
  return `${value.toFixed(digits)} °C`;
}

function timeAgo(iso: string, nowMs: number) {
  const seconds = Math.max(0, Math.round((nowMs - Date.parse(iso)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function VehicleLiveView() {
  const { data, isLoading, error } = useBydmateLiveQuery();
  const {
    data: points,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useBydmateTelemetryPointsQuery();
  const nowMs = useTickingClock(true);
  const snapshot = data?.[0] ?? null;

  if (isLoading) {
    return (
      <div className="safe-bottom flex flex-col gap-5 px-4 pb-6 pt-5">
        <Header />
        <Skeleton className="h-40 rounded-[1.75rem]" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[1.5rem]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="safe-bottom flex flex-col gap-5 px-4 pb-6 pt-5">
        <Header />
        <Card className="voltflow-card border-border bg-transparent">
          <CardContent className="p-6 text-muted-foreground">
            Could not load BYDMate telemetry.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!snapshot) {
    return <EmptyVehicleState />;
  }

  return (
    <VehicleLiveContent
      snapshot={snapshot}
      points={points ?? EMPTY_TELEMETRY_POINTS}
      isHistoryLoading={isHistoryLoading}
      hasHistoryError={Boolean(historyError)}
      nowMs={nowMs}
    />
  );
}

export function VehicleLiveFixtureView({
  snapshot,
  points,
}: {
  snapshot: BydmateLiveSnapshotRow;
  points: BydmateTelemetryPointRow[];
}) {
  const nowMs = useTickingClock(true);

  return (
    <VehicleLiveContent
      snapshot={snapshot}
      points={points}
      isHistoryLoading={false}
      hasHistoryError={false}
      nowMs={nowMs}
    />
  );
}

function VehicleLiveContent({
  snapshot,
  points,
  isHistoryLoading,
  hasHistoryError,
  nowMs,
}: {
  snapshot: BydmateLiveSnapshotRow;
  points: BydmateTelemetryPointRow[];
  isHistoryLoading: boolean;
  hasHistoryError: boolean;
  nowMs: number;
}) {
  const allPoints = useMemo(() => points, [points]);
  const availableDateKeys = useMemo(() => {
    return Array.from(new Set(allPoints.map((point) => localDateKey(pointTimeMs(point)))))
      .filter((key) => key !== "1970-01-01")
      .sort()
      .reverse();
  }, [allPoints]);
  const [fallbackDate] = useState(() => localDateKey(Date.now()));
  const [selectedDateOverride, setSelectedDateOverride] = useState<string | null>(null);
  const selectedDate = selectedDateOverride ?? availableDateKeys[0] ?? fallbackDate;
  const dayPoints = useMemo(() => {
    return allPoints.filter((point) => localDateKey(pointTimeMs(point)) === selectedDate);
  }, [allPoints, selectedDate]);
  const trips = useMemo(() => buildTrips(dayPoints), [dayPoints]);
  const [selectedTripId, setSelectedTripId] = useState<string | null | undefined>(undefined);
  const defaultTripId = trips[0]?.id ?? null;
  const expandedTripId = selectedTripId === undefined ? defaultTripId : selectedTripId;
  const isStale = nowMs - Date.parse(snapshot.received_at) > 90_000;

  return (
    <div className="safe-bottom flex flex-col gap-5 px-4 pb-6 pt-5">
      <Header />
      <Hero snapshot={snapshot} nowMs={nowMs} isStale={isStale} />
      {isStale ? <StaleTelemetryNotice /> : <TelemetryGrid telemetry={snapshot.telemetry} />}
      <TripBrowser
        selectedDate={selectedDate}
        availableDateKeys={availableDateKeys}
        onDateChange={(value) => {
          setSelectedDateOverride(value);
          setSelectedTripId(undefined);
        }}
        trips={trips}
        selectedTripId={expandedTripId}
        onSelectTrip={(tripId) => {
          setSelectedTripId((currentTripId) => {
            const currentExpandedTripId = currentTripId === undefined ? defaultTripId : currentTripId;
            return currentExpandedTripId === tripId ? null : tripId;
          });
        }}
        isLoading={isHistoryLoading}
        hasError={hasHistoryError}
      />
      <LocationCard snapshot={snapshot} />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <LogoFull />
      <BrandBadge className="hidden min-[380px]:inline-flex">BYDMate live</BrandBadge>
    </header>
  );
}

function Hero({
  snapshot,
  nowMs,
  isStale,
}: {
  snapshot: BydmateLiveSnapshotRow;
  nowMs: number;
  isStale: boolean;
}) {
  const t = snapshot.telemetry;

  return (
    <section className="voltflow-card overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.28em]">
            {snapshot.vehicle_id}
          </p>
          <h1 className="mt-3 font-heading text-5xl font-bold tracking-normal tabular-nums">
            {fmt(t.soc)}
            <span className="text-2xl text-muted-foreground">%</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Last update {timeAgo(snapshot.received_at, nowMs)}
          </p>
        </div>
        <span
          className={
            "rounded-full border px-4 py-2 font-heading text-xs font-semibold uppercase tracking-[0.2em] " +
            (isStale
              ? "border-yellow-300/25 bg-yellow-300/10 text-yellow-200"
              : "border-primary/25 bg-primary/10 text-primary")
          }
        >
          {isStale ? "stale" : "live"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <HeroMetric icon={Gauge} label="Speed" value={`${fmt(t.speed_kmh, 0)} km/h`} />
        <HeroMetric icon={Zap} label="Power" value={`${fmt(t.power_kw, 1)} kW`} />
        <HeroMetric icon={Route} label="Range" value={`${fmt(t.range_est_km, 0)} km`} />
      </div>
    </section>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white/[0.03] p-3">
      <Icon className="mb-2 size-4 text-primary" aria-hidden />
      <p className="text-muted-foreground text-[11px] uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-1 font-heading text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function StaleTelemetryNotice() {
  return (
    <Card className="border-yellow-300/20 bg-yellow-300/[0.06]">
      <CardContent className="p-5">
        <p className="font-heading text-lg font-semibold tracking-tight text-yellow-100">
          Car data hidden
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The latest vehicle snapshot is stale, so live car values are hidden until fresh telemetry
          arrives.
        </p>
      </CardContent>
    </Card>
  );
}

function TelemetryGrid({ telemetry }: { telemetry: BydmateTelemetry }) {
  const items = [
    { icon: BatteryCharging, label: "Charging", value: fmtBool(telemetry.is_charging) },
    { icon: Zap, label: "Charge power", value: `${fmt(telemetry.charge_power_kw, 1)} kW` },
    { icon: Activity, label: "Charge type", value: telemetry.charge_type ?? "—" },
    { icon: Thermometer, label: "Battery temp", value: fmtTemp(telemetry.battery_temp_c) },
    { icon: Thermometer, label: "Cabin temp", value: fmtTemp(telemetry.cabin_temp_c) },
    { icon: Thermometer, label: "Outside temp", value: fmtTemp(telemetry.outside_temp_c) },
    { icon: Activity, label: "Odometer", value: `${fmt(telemetry.odometer_km, 1)} km` },
    { icon: Activity, label: "SoH", value: `${fmt(telemetry.soh_percent, 1)}%` },
    { icon: Zap, label: "12V battery", value: `${fmt(telemetry.aux_voltage_v, 1)} V` },
    { icon: Route, label: "Trip distance", value: `${fmt(telemetry.current_trip_distance_km, 1)} km` },
    {
      icon: Gauge,
      label: "Trip consumption",
      value: `${fmt(telemetry.current_trip_consumption_kwh_100km, 1)} kWh/100`,
    },
    { icon: BatteryCharging, label: "kWh charged", value: `${fmt(telemetry.kwh_charged, 2)} kWh` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="border-border bg-white/[0.02]">
          <CardContent className="p-4">
            <item.icon className="mb-3 size-5 text-primary" aria-hidden />
            <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
              {item.label}
            </p>
            <p className="mt-2 font-heading text-xl font-semibold tracking-normal tabular-nums">
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type ChartPoint = {
  time: number;
  value: number;
};

type RoutePoint = {
  lat: number;
  lon: number;
  time: number;
};

type ChartSeries = {
  label: string;
  color: string;
  points: ChartPoint[];
};

type TelemetryChart = {
  title: string;
  unit: string;
  series: ChartSeries[];
  minValue: number;
  maxValue: number;
  minTime: number;
  maxTime: number;
  hasData: boolean;
};

type TripSegment = {
  id: string;
  points: BydmateTelemetryPointRow[];
  startMs: number;
  endMs: number;
  durationMs: number;
  distanceKm: number | null;
  socStart: number | null;
  socEnd: number | null;
  maxSpeed: number | null;
  avgSpeed: number | null;
  avgConsumptionKwh100Km: number | null;
};

const TRIP_GAP_MS = 5 * 60 * 1000;
const MAX_CHART_POINTS = 240;
const MAX_CHART_MARKERS = 80;
const MAX_ROUTE_POINTS = 400;
const EMPTY_TELEMETRY_POINTS: BydmateTelemetryPointRow[] = [];

function validNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function validTempNumber(value: number | null | undefined) {
  const n = validNumber(value);
  return n != null && n >= -50 && n <= 90 ? n : null;
}

function pointTimeMs(point: BydmateTelemetryPointRow) {
  const deviceMs = Date.parse(point.device_time);
  if (Number.isFinite(deviceMs)) return deviceMs;
  const receivedMs = Date.parse(point.received_at);
  return Number.isFinite(receivedMs) ? receivedMs : 0;
}

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

function localDateKey(ms: number) {
  const date = new Date(ms);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatClock(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function buildTrips(points: BydmateTelemetryPointRow[]): TripSegment[] {
  const sorted = [...points]
    .filter((point) => pointTimeMs(point) > 0)
    .sort((a, b) => pointTimeMs(a) - pointTimeMs(b));

  const groups: BydmateTelemetryPointRow[][] = [];
  for (const point of sorted) {
    const lastGroup = groups.at(-1);
    const previous = lastGroup?.at(-1);
    if (!lastGroup || !previous || pointTimeMs(point) - pointTimeMs(previous) > TRIP_GAP_MS) {
      groups.push([point]);
    } else {
      lastGroup.push(point);
    }
  }

  return groups.map((tripPoints, index) => {
    const startMs = pointTimeMs(tripPoints[0]);
    const endMs = pointTimeMs(tripPoints.at(-1) ?? tripPoints[0]);
    const speeds = tripPoints
      .map((point) => validNumber(point.telemetry.speed_kmh))
      .filter((value): value is number => value != null);
    const consumptionValues = tripPoints
      .map((point) => validNumber(point.telemetry.current_trip_consumption_kwh_100km))
      .filter((value): value is number => value != null && value >= 0);
    const odometerValues = tripPoints
      .map((point) => validNumber(point.telemetry.odometer_km))
      .filter((value): value is number => value != null);
    const tripDistanceValues = tripPoints
      .map((point) => validNumber(point.telemetry.current_trip_distance_km))
      .filter((value): value is number => value != null);
    const odometerDistance =
      odometerValues.length > 1 ? odometerValues.at(-1)! - odometerValues[0] : null;
    const tripDistance =
      tripDistanceValues.length > 0 ? Math.max(...tripDistanceValues) - Math.min(...tripDistanceValues) : null;
    const distanceKm =
      odometerDistance != null && odometerDistance >= 0
        ? odometerDistance
        : tripDistance != null && tripDistance >= 0
          ? tripDistance
          : null;

    return {
      id: `${startMs}-${index}`,
      points: tripPoints,
      startMs,
      endMs,
      durationMs: Math.max(0, endMs - startMs),
      distanceKm,
      socStart: validNumber(tripPoints[0]?.telemetry.soc),
      socEnd: validNumber(tripPoints.at(-1)?.telemetry.soc),
      maxSpeed: speeds.length ? Math.max(...speeds) : null,
      avgSpeed: speeds.length ? speeds.reduce((sum, value) => sum + value, 0) / speeds.length : null,
      avgConsumptionKwh100Km: consumptionValues.length
        ? consumptionValues.reduce((sum, value) => sum + value, 0) / consumptionValues.length
        : null,
    };
  }).reverse();
}

function TripBrowser({
  selectedDate,
  availableDateKeys,
  onDateChange,
  trips,
  selectedTripId,
  onSelectTrip,
  isLoading,
  hasError,
}: {
  selectedDate: string;
  availableDateKeys: string[];
  onDateChange: (value: string) => void;
  trips: TripSegment[];
  selectedTripId: string | null;
  onSelectTrip: (id: string) => void;
  isLoading: boolean;
  hasError: boolean;
}) {
  const totalDistance = trips.reduce((sum, trip) => sum + (trip.distanceKm ?? 0), 0);

  return (
    <section className="voltflow-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Trips</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Trips are split when telemetry is silent for more than 5 minutes.
          </p>
        </div>
        <label className="grid gap-1 text-sm text-muted-foreground">
          Date
          <Input
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="w-44"
          />
        </label>
      </div>

      {availableDateKeys.length > 0 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {availableDateKeys.slice(0, 14).map((dateKey) => {
            const selected = dateKey === selectedDate;
            const date = new Date(`${dateKey}T12:00:00`);
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => onDateChange(dateKey)}
                className={
                  "shrink-0 rounded-full border px-3 py-2 text-sm transition " +
                  (selected
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-white/[0.03] text-muted-foreground hover:border-primary/50 hover:text-foreground")
                }
                title={`Telemetry data exists on ${dateKey}`}
              >
                <span className="font-heading font-semibold">
                  {date.toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-3 gap-3">
        <SummaryPill label="Trips" value={isLoading ? "…" : String(trips.length)} />
        <SummaryPill label="Distance" value={`${fmt(totalDistance, 1)} km`} />
        <SummaryPill
          label="Points"
          value={String(trips.reduce((sum, trip) => sum + trip.points.length, 0))}
        />
      </div>

      {hasError ? (
        <p className="mt-5 rounded-2xl border border-border bg-white/[0.03] p-4 text-sm text-muted-foreground">
          Could not load trip history.
        </p>
      ) : trips.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-border bg-white/[0.03] p-4 text-sm text-muted-foreground">
          No telemetry trips for this date yet.
        </p>
      ) : (
        <div className="mt-5 grid gap-3">
          {trips.map((trip, index) => {
            const tripLabel = `Trip ${trips.length - index}`;
            const expanded = trip.id === selectedTripId;

            return (
              <div key={trip.id} className="grid gap-3">
                <TripListItem
                  trip={trip}
                  tripLabel={tripLabel}
                  expanded={expanded}
                  onSelect={() => onSelectTrip(trip.id)}
                />
                {expanded ? (
                  <>
                    <TelemetryHistoryCharts
                      points={trip.points}
                      isLoading={isLoading}
                      hasError={hasError}
                      embedded
                    />
                    <RouteMap points={trip.points} embedded />
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TripListItem({
  trip,
  tripLabel,
  expanded,
  onSelect,
}: {
  trip: TripSegment;
  tripLabel: string;
  expanded: boolean;
  onSelect: () => void;
}) {
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-expanded={false}
        className="grid min-h-14 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-border bg-white/[0.02] px-4 py-3 text-left transition hover:border-primary/50 hover:bg-white/[0.04]"
      >
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold tracking-tight">
            {tripLabel}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {formatClock(trip.startMs)} - {formatClock(trip.endMs)} · {formatDuration(trip.durationMs)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm tabular-nums text-muted-foreground">
          <span>{fmt(trip.distanceKm, 1)} km</span>
          <span className="hidden min-[430px]:inline">{trip.points.length} pts</span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-expanded
      className="rounded-2xl border border-primary bg-primary/10 p-4 text-left transition"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <ChevronDown className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-heading text-lg font-semibold tracking-tight">
              {tripLabel}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatClock(trip.startMs)} - {formatClock(trip.endMs)} · {formatDuration(trip.durationMs)}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {trip.points.length} pts
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 min-[430px]:grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))]">
        <MiniStat label="Distance" value={`${fmt(trip.distanceKm, 1)} km`} />
        <MiniStat label="SOC" value={`${fmt(trip.socStart)}% -> ${fmt(trip.socEnd)}%`} />
        <MiniStat label="Consumption" value={`${fmt(trip.avgConsumptionKwh100Km, 1)} kWh/100`} />
        <MiniStat label="Max speed" value={`${fmt(trip.maxSpeed)} km/h`} />
        <MiniStat label="Avg speed" value={`${fmt(trip.avgSpeed)} km/h`} />
      </div>
    </button>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/[0.02] p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function downsamplePoints<T>(points: T[], maxPoints: number) {
  if (points.length <= maxPoints) return points;
  if (maxPoints <= 1) return points.slice(0, 1);

  const lastIndex = points.length - 1;
  const sampled: T[] = [];
  let previousIndex = -1;

  for (let index = 0; index < maxPoints; index += 1) {
    const sourceIndex = Math.round((index * lastIndex) / (maxPoints - 1));
    if (sourceIndex !== previousIndex) {
      sampled.push(points[sourceIndex]);
      previousIndex = sourceIndex;
    }
  }

  return sampled;
}

function createChart(
  title: string,
  unit: string,
  series: ChartSeries[],
): TelemetryChart {
  return {
    title,
    unit,
    series,
    minValue: 0,
    maxValue: 1,
    minTime: 0,
    maxTime: 1,
    hasData: false,
  };
}

function addChartPoint(chart: TelemetryChart, seriesIndex: number, time: number, value: number | null) {
  if (value == null || !Number.isFinite(time)) return;

  chart.series[seriesIndex].points.push({ time, value });
  chart.minValue = chart.hasData ? Math.min(chart.minValue, value) : value;
  chart.maxValue = chart.hasData ? Math.max(chart.maxValue, value) : value;
  chart.minTime = chart.hasData ? Math.min(chart.minTime, time) : time;
  chart.maxTime = chart.hasData ? Math.max(chart.maxTime, time) : time;
  chart.hasData = true;
}

function prepareTelemetryHistory(points: BydmateTelemetryPointRow[]) {
  const socChart = createChart("SOC", "%", [
    { label: "SOC", color: "var(--voltflow-cyan)", points: [] },
  ]);
  const speedChart = createChart("Speed", "km/h", [
    { label: "Speed", color: "#7dd3fc", points: [] },
  ]);
  const powerChart = createChart("Power", "kW", [
    { label: "Power", color: "#facc15", points: [] },
  ]);
  const temperatureChart = createChart("Temperatures", "°C", [
    { label: "Battery", color: "#22c55e", points: [] },
    { label: "Outside", color: "#38bdf8", points: [] },
    { label: "Cabin", color: "#fb7185", points: [] },
  ]);

  let visiblePointCount = 0;
  let start: string | undefined;
  let end: string | undefined;

  for (const point of points) {
    if (!point.telemetry) continue;

    visiblePointCount += 1;
    start ??= point.received_at;
    end = point.received_at;

    const time = Date.parse(point.received_at);
    addChartPoint(socChart, 0, time, validNumber(point.telemetry.soc));
    addChartPoint(speedChart, 0, time, validNumber(point.telemetry.speed_kmh));
    addChartPoint(powerChart, 0, time, validNumber(point.telemetry.power_kw));
    addChartPoint(temperatureChart, 0, time, validTempNumber(point.telemetry.battery_temp_c));
    addChartPoint(temperatureChart, 1, time, validTempNumber(point.telemetry.outside_temp_c));
    addChartPoint(temperatureChart, 2, time, validTempNumber(point.telemetry.cabin_temp_c));
  }

  const charts = [socChart, speedChart, powerChart, temperatureChart].map((chart) => ({
    ...chart,
    series: chart.series.map((series) => ({
      ...series,
      points: downsamplePoints(series.points, MAX_CHART_POINTS),
    })),
  }));

  return {
    visiblePointCount,
    start,
    end,
    charts,
  };
}

export function TelemetryHistoryCharts({
  points,
  isLoading,
  hasError,
  embedded = false,
}: {
  points: BydmateTelemetryPointRow[];
  isLoading: boolean;
  hasError: boolean;
  embedded?: boolean;
}) {
  const history = useMemo(() => prepareTelemetryHistory(points), [points]);

  return (
    <section className={embedded ? "rounded-2xl border border-border bg-white/[0.02] p-4" : "voltflow-card p-5"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Trip charts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {history.visiblePointCount} cloud points
            {history.start && history.end ? ` · ${new Date(history.start).toLocaleTimeString()} - ${new Date(history.end).toLocaleTimeString()}` : ""}
          </p>
        </div>
        <span className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          15s refresh
        </span>
      </div>

      {isLoading ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : hasError ? (
        <p className="mt-5 rounded-2xl border border-border bg-white/[0.03] p-4 text-sm text-muted-foreground">
          Could not load telemetry history.
        </p>
      ) : history.visiblePointCount === 0 ? (
        <p className="mt-5 rounded-2xl border border-border bg-white/[0.03] p-4 text-sm text-muted-foreground">
          History will appear after CloudEV Mate sends telemetry points.
        </p>
      ) : (
        <>
          {history.visiblePointCount < 2 ? (
            <p className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
              One point received. Charts will turn into lines after the next cloud payload.
            </p>
          ) : null}
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {history.charts.map((chart) => (
              <TelemetryLineChart
                key={chart.title}
                chart={chart}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function TelemetryLineChart({ chart }: { chart: TelemetryChart }) {
  const { title, unit, series, hasData, minValue, maxValue, minTime, maxTime } = chart;
  const valuePad = Math.max((maxValue - minValue) * 0.12, maxValue === minValue ? 1 : 0);
  const yMin = minValue - valuePad;
  const yMax = maxValue + valuePad;

  const x = (time: number) => {
    if (maxTime === minTime) return 160;
    return 18 + ((time - minTime) / (maxTime - minTime)) * 284;
  };
  const y = (value: number) => {
    if (yMax === yMin) return 60;
    return 104 - ((value - yMin) / (yMax - yMin)) * 88;
  };

  return (
    <article className="rounded-2xl border border-border bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasData ? `${fmt(minValue, 1)}-${fmt(maxValue, 1)} ${unit}` : "No values"}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {series.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <svg className="mt-4 h-36 w-full overflow-visible" viewBox="0 0 320 128" role="img" aria-label={`${title} history chart`}>
        <line x1="18" x2="302" y1="104" y2="104" stroke="currentColor" className="text-border" strokeWidth="1" />
        <line x1="18" x2="302" y1="16" y2="16" stroke="currentColor" className="text-border/60" strokeWidth="1" strokeDasharray="4 6" />
        {series.map((item) => {
          const d = item.points
            .map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.time).toFixed(2)} ${y(point.value).toFixed(2)}`)
            .join(" ");
          const markers = item.points.length <= MAX_CHART_MARKERS ? item.points : [];
          return (
            <g key={item.label}>
              {item.points.length > 1 ? (
                <path d={d} fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
              {markers.map((point, index) => (
                <circle key={`${item.label}-${point.time}-${index}`} cx={x(point.time)} cy={y(point.value)} r="3.5" fill={item.color} />
              ))}
            </g>
          );
        })}
      </svg>
    </article>
  );
}

function prepareRoute(points: BydmateTelemetryPointRow[]) {
  const routePoints: RoutePoint[] = [];
  let minLat = 0;
  let maxLat = 1;
  let minLon = 0;
  let maxLon = 1;

  for (const point of points) {
    const lat = validNumber(point.location.lat);
    const lon = validNumber(point.location.lon);
    const time = pointTimeMs(point);
    if (lat == null || lon == null || !Number.isFinite(time)) continue;

    routePoints.push({ lat, lon, time });
    if (routePoints.length === 1) {
      minLat = lat;
      maxLat = lat;
      minLon = lon;
      maxLon = lon;
    } else {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    }
  }

  return {
    points: downsamplePoints(routePoints, MAX_ROUTE_POINTS),
    totalPoints: routePoints.length,
    start: routePoints[0],
    end: routePoints.at(-1),
    minLat,
    maxLat,
    minLon,
    maxLon,
  };
}

export function RouteMap({
  points,
  embedded = false,
}: {
  points: BydmateTelemetryPointRow[];
  embedded?: boolean;
}) {
  const route = useMemo(() => prepareRoute(points), [points]);
  const hasRoute = route.totalPoints > 0;
  const minLat = hasRoute ? route.minLat : 0;
  const maxLat = hasRoute ? route.maxLat : 1;
  const minLon = hasRoute ? route.minLon : 0;
  const maxLon = hasRoute ? route.maxLon : 1;
  const latPad = Math.max((maxLat - minLat) * 0.12, maxLat === minLat ? 0.001 : 0);
  const lonPad = Math.max((maxLon - minLon) * 0.12, maxLon === minLon ? 0.001 : 0);
  const yMin = minLat - latPad;
  const yMax = maxLat + latPad;
  const xMin = minLon - lonPad;
  const xMax = maxLon + lonPad;

  const x = (lon: number) => 16 + ((lon - xMin) / (xMax - xMin)) * 288;
  const y = (lat: number) => 164 - ((lat - yMin) / (yMax - yMin)) * 148;
  const path = route.points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.lon).toFixed(2)} ${y(point.lat).toFixed(2)}`)
    .join(" ");
  const start = route.start;
  const end = route.end;

  return (
    <section className={embedded ? "rounded-2xl border border-border bg-white/[0.02] p-4" : "voltflow-card p-5"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Route</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {route.totalPoints} GPS points in the selected trip
          </p>
        </div>
        {start && end ? (
          <span className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {formatClock(start.time)} - {formatClock(end.time)}
          </span>
        ) : null}
      </div>

      {route.totalPoints === 0 ? (
        <p className="mt-5 rounded-2xl border border-border bg-white/[0.03] p-4 text-sm text-muted-foreground">
          No GPS points in this trip. Check location permission in CloudEV Gateway.
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))]">
          <svg className="h-64 w-full" viewBox="0 0 320 180" role="img" aria-label="Selected trip route">
            <defs>
              <pattern id="route-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M24 0H0V24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="320" height="180" fill="url(#route-grid)" />
            {route.points.length > 1 ? (
              <path d={path} fill="none" stroke="var(--voltflow-cyan)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
            {start ? (
              <circle cx={x(start.lon)} cy={y(start.lat)} r="5" fill="#22c55e">
                <title>Start</title>
              </circle>
            ) : null}
            {end ? (
              <circle cx={x(end.lon)} cy={y(end.lat)} r="5" fill="#facc15">
                <title>End</title>
              </circle>
            ) : null}
          </svg>
          <div className="grid grid-cols-2 gap-3 border-t border-border p-4 text-sm">
            <MiniStat label="Start" value={start ? `${start.lat.toFixed(5)}, ${start.lon.toFixed(5)}` : "—"} />
            <MiniStat label="End" value={end ? `${end.lat.toFixed(5)}, ${end.lon.toFixed(5)}` : "—"} />
          </div>
        </div>
      )}
    </section>
  );
}

function LocationCard({ snapshot }: { snapshot: BydmateLiveSnapshotRow }) {
  const loc = snapshot.location;
  const hasLocation = typeof loc.lat === "number" && typeof loc.lon === "number";

  return (
    <Card className="voltflow-card border-border bg-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl tracking-tight">
          <MapPin className="size-5 text-primary" aria-hidden />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-base">
        {hasLocation ? (
          <>
            <Row label="Latitude" value={fmt(loc.lat, 6)} />
            <Row label="Longitude" value={fmt(loc.lon, 6)} />
            <Row label="Accuracy" value={`${fmt(loc.accuracy_m, 1)} m`} />
            <Row label="Bearing" value={`${fmt(loc.bearing_deg, 0)}°`} />
          </>
        ) : (
          <p className="text-muted-foreground">
            No GPS in the latest payload. BYDMate sends location only when Android location permission is granted.
          </p>
        )}
        <Row label="Device time" value={new Date(snapshot.device_time).toLocaleString()} />
        <Row label="Received" value={new Date(snapshot.received_at).toLocaleString()} />
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border py-3 first:border-t-0 first:pt-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-heading font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function EmptyVehicleState() {
  return (
    <div className="safe-bottom flex flex-col gap-5 px-4 pb-6 pt-5">
      <Header />
      <section className="voltflow-card p-6">
        <CarFront className="size-10 text-primary" aria-hidden />
        <h1 className="mt-5 font-heading text-3xl font-bold tracking-normal">
          No car data yet
        </h1>
        <p className="mt-3 text-muted-foreground leading-7">
          Generate a BYDMate key in Settings, paste it into the Android app, and set
          the endpoint to <span className="font-mono">/api/bydmate/telemetry</span>.
          The first accepted payload will appear here.
        </p>
        <div className="mt-5 rounded-2xl border border-border bg-white/[0.03] p-4 text-sm text-muted-foreground">
          <Clock3 className="mb-2 size-4 text-primary" aria-hidden />
          The page refreshes every 5 seconds while open.
        </div>
      </section>
    </div>
  );
}
