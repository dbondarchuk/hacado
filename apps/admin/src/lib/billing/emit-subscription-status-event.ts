import { ServicesContainer } from "@hacado/services";
import {
  SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE,
  systemEventSource,
  type SubscriptionStatusChangedPayload,
} from "@hacado/types";

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
