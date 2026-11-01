import { DateTime } from "luxon";
import { getBullMQBaseConfig } from "../utils";
import { BullMQJobConfig } from "./types";

export const getBullMQJobConfig = (
  overrides?: Partial<BullMQJobConfig>,
): BullMQJobConfig => {
  return {
    ...getBullMQBaseConfig(),
    queues: {
      job: {
        name: process.env.BULLMQ_JOB_QUEUE_NAME || "jobs",
        concurrency: parseInt(process.env.BULLMQ_JOB_CONCURRENCY || "5"),
      },
    },
    ...overrides,
  };
};

/**
 * Recursively serializes Dates and Luxon DateTimes into ISO strings.
 */
export function serializeJobData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(serializeJobData) as any;
  }
  if (value instanceof Date) {
    return value.toISOString() as any;
  }
  if (DateTime.isDateTime(value)) {
    return value.toISO() as any;
  }

  if (value && typeof value === "object") {
    const result: any = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeJobData(v);
    }

    return result;
  }

  return value;
}

/**
 * Recursively revives ISO strings back to Date
 */
export function reviveJobData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => reviveJobData(v)) as any;
  }
  if (
    value &&
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
  ) {
    return new Date(value) as any;
  }
  if (value && value instanceof Date) {
    return value;
  }

  if (value && typeof value === "object") {
    const result: any = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = reviveJobData(v);
    }

    return result;
  }

  return value;
}
