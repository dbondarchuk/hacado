import { getLoggerFactory } from "@hacado/logger";
import type { EventEnvelope, EventSource, IEventService } from "@hacado/types";
import { randomUUID } from "crypto";
import { BaseBullMQClient } from "../bullmq/base-bullmq-client";
import { serializeJobData } from "../bullmq/jobs/utils";
import type { BullMQEventConfig } from "./bullmq-event-types";

export class BullMQEventService
  extends BaseBullMQClient
  implements IEventService
{
  protected readonly config: BullMQEventConfig;

  constructor(
    protected readonly organizationId: string,
    config: BullMQEventConfig,
  ) {
    super(config, getLoggerFactory("BullMQEventService", organizationId));
    this.config = config;
    this.createQueue(this.config.queues.events.name);
  }

  public async emit(
    type: string,
    payload: unknown,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("emit");
    const envelope: EventEnvelope = {
      id: randomUUID(),
      type,
      payload,
      organizationId: this.organizationId,
      createdAt: new Date(),
      source,
    };

    const queue = this.getQueue(this.config.queues.events.name);
    await queue.add("event", serializeJobData(envelope), {
      jobId: envelope.id,
    });

    logger.info({ type, eventId: envelope.id }, "Event queued");
  }
}
