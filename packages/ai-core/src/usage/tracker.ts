import { getBaseLoggerFactory } from "@hacado/logger";
import type { BuilderAIUsageEvent, UsageTracker } from "./types";

const logger = getBaseLoggerFactory({});

const defaultTracker: UsageTracker = {
  track(event) {
    logger.info(
      {
        organizationId: event.organizationId,
        builder: event.builder,
        task: event.task,
        provider: event.provider,
        model: event.model,
        success: event.success,
        usage: event.usage,
        modelCalls: event.modelCalls,
        toolCalls: event.toolCalls,
        retries: event.retries,
        escalations: event.escalations,
        durationMs: event.durationMs,
        estimatedCostUsd: event.estimatedCostUsd,
        conversationId: event.conversationId,
        errorCode: event.errorCode,
      },
      "builder-ai.usage",
    );
  },
};

let tracker: UsageTracker = defaultTracker;

export function setUsageTracker(next: UsageTracker) {
  tracker = next;
}

export function getUsageTracker(): UsageTracker {
  return tracker;
}

export async function trackUsage(event: BuilderAIUsageEvent) {
  await tracker.track(event);
}

export function resetUsageTrackerForTests() {
  tracker = defaultTracker;
}
