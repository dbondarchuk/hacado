import { WithOrganizationId } from "../database";
import type { EventEnvelope } from "../events/envelope";

export type BaseJobRequest = {
  id?: string;
  executeAt: Date | "now";
  deduplication?: {
    id: string;
    ttl: number;
  };
};

/** Options for a BullMQ job scheduler (interval repeat). */
export type RepeatableJobOptions = {
  /** Interval between runs, in milliseconds. */
  every: number;
  /** Stable job scheduler id used to upsert or remove this schedule. */
  id: string;
};

export type AppJobRequest<T = any> = BaseJobRequest & {
  type: "app";
  appId: string;
  payload: T;
};

/** Delivers an {@link EventEnvelope} to a single app subscriber (built-in or connected). */
export type EventDeliveryJobRequest = BaseJobRequest & {
  type: "event";
  appId: string;
  eventType: string;
  envelope: EventEnvelope;
};

/** First-party core work for an organization, dispatched via requestType registry. */
export type CoreJobRequest<T = unknown> = BaseJobRequest & {
  type: "core";
  requestType: string;
  payload?: T;
};

export type JobRequest =
  | AppJobRequest
  | EventDeliveryJobRequest
  | CoreJobRequest;
export type OrganizationJobRequest = WithOrganizationId<JobRequest>;

export type ScheduleRepeatableJobRequest =
  | Omit<AppJobRequest, "executeAt" | "deduplication">
  | Omit<EventDeliveryJobRequest, "executeAt" | "deduplication">
  | Omit<CoreJobRequest, "executeAt" | "deduplication">;

export type Job = JobRequest & {
  id: string;
  createdAt: Date;
};
