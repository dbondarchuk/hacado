import {
  BookingProgressAnalyticsDaily,
  BookingProgressAnalyticsMetrics,
} from "@hacado/types";
import { DateTime } from "luxon";
import { mergeCountMaps, sumRecordValues } from "./metrics-delta";

export type TimeGrouping = "day" | "week" | "month";

export type BookingProgressStats = {
  total: number;
  abandoned: number;
  converted: number;
  abandonmentRate: number;
  conversionRate: number;
};

export type BookingProgressStepBreakdownItem = {
  step: string;
  count: number;
  percentage: number;
};

export type BookingProgressStatOverTime = {
  date: string;
  total: number;
  abandoned: number;
  converted: number;
};

export type BookingProgressConversionByType = {
  convertedTo: string;
  count: number;
  percentage: number;
};

export function summarizeBookingProgress(
  docs: BookingProgressAnalyticsDaily[],
  timeGrouping: TimeGrouping,
  timeZone: string,
): {
  stats: BookingProgressStats;
  overTime: BookingProgressStatOverTime[];
  entered: BookingProgressStepBreakdownItem[];
  stoppedAt: BookingProgressStepBreakdownItem[];
  convertedTo: BookingProgressConversionByType[];
} {
  const totals = mergeMetrics(docs.map((doc) => doc.metrics));
  const started = totals.started;
  const converted = totals.completed;
  const abandoned = sumRecordValues(totals.stoppedAt);

  const stats: BookingProgressStats = {
    total: started,
    abandoned,
    converted,
    abandonmentRate: started > 0 ? (abandoned / started) * 100 : 0,
    conversionRate: started > 0 ? (converted / started) * 100 : 0,
  };

  const buckets = new Map<
    string,
    { total: number; abandoned: number; converted: number }
  >();
  for (const doc of docs) {
    const key = groupingKey(doc.date, timeGrouping, timeZone);
    const current = buckets.get(key) ?? {
      total: 0,
      abandoned: 0,
      converted: 0,
    };
    current.total += doc.metrics.started ?? 0;
    current.converted += doc.metrics.completed ?? 0;
    current.abandoned += sumRecordValues(doc.metrics.stoppedAt);
    buckets.set(key, current);
  }

  const overTime: BookingProgressStatOverTime[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }));

  return {
    stats,
    overTime,
    entered: toBreakdown(totals.entered),
    stoppedAt: toBreakdown(totals.stoppedAt),
    convertedTo: toConversionBreakdown(totals.convertedTo),
  };
}

export function mergeMetrics(
  metricsList: BookingProgressAnalyticsMetrics[],
): BookingProgressAnalyticsMetrics {
  return {
    started: metricsList.reduce((sum, m) => sum + (m.started ?? 0), 0),
    completed: metricsList.reduce((sum, m) => sum + (m.completed ?? 0), 0),
    entered: mergeCountMaps(metricsList.map((m) => m.entered)),
    stoppedAt: mergeCountMaps(metricsList.map((m) => m.stoppedAt)),
    convertedTo: mergeCountMaps(metricsList.map((m) => m.convertedTo)),
  };
}

export function groupingKey(
  date: Date,
  timeGrouping: TimeGrouping,
  timeZone: string,
): string {
  const dt = DateTime.fromJSDate(date, { zone: "utc" }).setZone(
    timeZone || "UTC",
  );
  switch (timeGrouping) {
    case "week":
      return dt.startOf("week").toFormat("yyyy-MM-dd");
    case "month":
      return dt.toFormat("yyyy-MM");
    case "day":
    default:
      return dt.toFormat("yyyy-MM-dd");
  }
}

function toBreakdown(
  map: Record<string, number> | undefined,
): BookingProgressStepBreakdownItem[] {
  const entries = Object.entries(map ?? {}).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  return entries
    .map(([step, count]) => ({
      step,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function toConversionBreakdown(
  map: Record<string, number> | undefined,
): BookingProgressConversionByType[] {
  const entries = Object.entries(map ?? {}).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  return entries
    .map(([convertedTo, count]) => ({
      convertedTo,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
