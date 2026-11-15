import { getLoggerFactory } from "@hacado/logger";
import type { CommunicationFailedPayload } from "@hacado/types/events";
import {
  COMMUNICATION_FAILED_EVENT_TYPE,
  systemEventSource,
} from "@hacado/types/events";
import type { IEventService } from "@hacado/types/services";

export async function emitCommunicationFailed(
  eventService: IEventService,
  payload: CommunicationFailedPayload,
): Promise<void> {
  const logger = getLoggerFactory("Events/EmitCommunicationFailed")("emit");

  try {
    await eventService.emit(
      COMMUNICATION_FAILED_EVENT_TYPE,
      payload,
      systemEventSource,
    );
  } catch (error) {
    logger.error(
      {
        error,
        logId: payload.logId,
        channel: payload.channel,
        cause: payload.cause,
      },
      "Failed to emit communication.failed event",
    );
  }
}
