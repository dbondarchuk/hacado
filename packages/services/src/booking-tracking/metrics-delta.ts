import { BookingProgressMetricsDelta } from "@hacado/types";

export function metricsDeltaToInc(
  delta: BookingProgressMetricsDelta,
): Record<string, number> {
  const inc: Record<string, number> = {};

  if (delta.started) inc["metrics.started"] = delta.started;
  if (delta.completed) inc["metrics.completed"] = delta.completed;

  for (const [step, count] of Object.entries(delta.entered ?? {})) {
    if (count) inc[`metrics.entered.${step}`] = count;
  }
  for (const [step, count] of Object.entries(delta.stoppedAt ?? {})) {
    if (count) inc[`metrics.stoppedAt.${step}`] = count;
  }
  for (const [type, count] of Object.entries(delta.convertedTo ?? {})) {
    if (count) inc[`metrics.convertedTo.${type}`] = count;
  }

  return inc;
}

export function isEmptyDelta(delta: BookingProgressMetricsDelta): boolean {
  return Object.keys(metricsDeltaToInc(delta)).length === 0;
}

export function emptyMetrics(): {
  started: number;
  completed: number;
  entered: Record<string, number>;
  stoppedAt: Record<string, number>;
  convertedTo: Record<string, number>;
} {
  return {
    started: 0,
    completed: 0,
    entered: {},
    stoppedAt: {},
    convertedTo: {},
  };
}

export function mergeCountMaps(
  maps: Array<Record<string, number> | undefined>,
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const map of maps) {
    if (!map) continue;
    for (const [key, value] of Object.entries(map)) {
      if (!value) continue;
      merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return merged;
}

export function sumRecordValues(
  map: Record<string, number> | undefined,
): number {
  if (!map) return 0;
  return Object.values(map).reduce((sum, value) => sum + value, 0);
}
