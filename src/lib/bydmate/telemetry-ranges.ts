export type TelemetryHistoryRange = "day" | "week" | "month" | "quarter" | "year";

const RANGE_DAYS: Record<TelemetryHistoryRange, number> = {
  day: 1,
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

export const MAX_TELEMETRY_CHART_POINTS = 2400;

export function parseTelemetryRange(value: string | null): TelemetryHistoryRange {
  if (value === "week" || value === "month" || value === "quarter" || value === "year") {
    return value;
  }
  return "day";
}

export function resolveTelemetryWindow(range: TelemetryHistoryRange, anchorDate: string) {
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(anchorDate)
    ? new Date(`${anchorDate}T23:59:59.999Z`)
    : new Date();
  const toMs = anchor.getTime();
  const fromMs = toMs - RANGE_DAYS[range] * 24 * 60 * 60 * 1000 + 1;

  return {
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    useHourly: range !== "day",
    rawSampleDays: range === "week" ? 3 : range === "day" ? 1 : 0,
  };
}

export function downsampleByIndex<T>(points: T[], maxPoints: number): T[] {
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
