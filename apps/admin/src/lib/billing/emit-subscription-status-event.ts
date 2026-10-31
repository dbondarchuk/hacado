import { ServicesContainer } from "@hacado/services/container";
import type { SubscriptionStatusChangedPayload } from "@hacado/types/events";
import {
  SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE,
  systemEventSource,
} from "@hacado/types/events";

export async function emitSubscriptionStatusChangedEvent(
  organizationId: string,
  payload: SubscriptionStatusChangedPayload,
): Promise<void> {
  const services = ServicesContainer(organizationId);
  await services.eventService.emit(
    SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE,
    payload,
    systemEventSource,
  );
}
