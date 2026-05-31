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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** ISO week Monday for the given calendar date (YYYY-MM-DD). */
export function isoWeekMondayFromDate(dateStr: string): Date {
  const date = new Date(`${dateStr}T12:00:00.000Z`);
  const day = date.getUTCDay() || 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - (day - 1));
  return monday;
}

/** HTML `<input type="week">` value (YYYY-Www) for a calendar date anchor. */
export function isoWeekValueFromDate(dateStr: string): string {
  const monday = isoWeekMondayFromDate(dateStr);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const year = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const week =
    1 + Math.round((monday.getTime() - firstMonday.getTime()) / (7 * 86400000));
  return `${year}-W${pad2(week)}`;
}

/** End-of-week anchor (Sunday) for an ISO week input value. */
export function isoWeekValueToAnchorDate(weekValue: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekValue);
  if (!match) return new Date().toISOString().slice(0, 10);

  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const monday = new Date(firstMonday);
  monday.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return sunday.toISOString().slice(0, 10);
}

export function snapAnchorDateForRange(
  range: TelemetryHistoryRange,
  anchorDate: string,
): string {
  switch (range) {
    case "week":
      return isoWeekValueToAnchorDate(isoWeekValueFromDate(anchorDate));
    case "month":
      return monthValueToAnchorDate(monthValueFromDate(anchorDate));
    case "quarter":
      return quarterValueToAnchorDate(quarterValueFromDate(anchorDate));
    case "year":
      return yearValueToAnchorDate(yearValueFromDate(anchorDate));
    default:
      return anchorDate;
  }
}

/** HTML `<input type="month">` value (YYYY-MM) for a calendar date anchor. */
export function monthValueFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Last day of the selected month as anchor (YYYY-MM-DD). */
export function monthValueToAnchorDate(monthValue: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue);
  if (!match) return new Date().toISOString().slice(0, 10);
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) {
    return new Date().toISOString().slice(0, 10);
  }
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

/** Quarter token (YYYY-Qn) for a calendar date anchor. */
export function quarterValueFromDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00.000Z`);
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${date.getUTCFullYear()}-Q${quarter}`;
}

/** Last day of the selected quarter as anchor (YYYY-MM-DD). */
export function quarterValueToAnchorDate(quarterValue: string): string {
  const match = /^(\d{4})-Q([1-4])$/.exec(quarterValue);
  if (!match) return new Date().toISOString().slice(0, 10);
  const year = Number(match[1]);
  const quarter = Number(match[2]);
  const endMonth = quarter * 3;
  return new Date(Date.UTC(year, endMonth, 0)).toISOString().slice(0, 10);
}

/** Four-digit year for a calendar date anchor. */
export function yearValueFromDate(dateStr: string): string {
  return dateStr.slice(0, 4);
}

/** Dec 31 of the selected year as anchor (YYYY-MM-DD). */
export function yearValueToAnchorDate(yearValue: string): string {
  const year = Number(yearValue);
  if (!Number.isFinite(year) || year < 1970 || year > 2100) {
    return new Date().toISOString().slice(0, 10);
  }
  return `${year}-12-31`;
}
