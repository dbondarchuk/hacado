import type {
  DeliveredPushPayload,
  PushNotification,
  PushSubscriptionRecord,
  UpsertPushSubscriptionInput,
} from "../apps/notifications/push";

export interface IPushNotificationsService {
  upsertSubscription(
    input: UpsertPushSubscriptionInput,
  ): Promise<PushSubscriptionRecord>;

  deleteSubscriptionByEndpoint(endpoint: string): Promise<void>;

  deleteSubscriptionsByMemberId(memberId: string): Promise<void>;

  listSubscriptionsByOrganization(): Promise<PushSubscriptionRecord[]>;

  getSubscriptionByEndpoint(
    endpoint: string,
  ): Promise<PushSubscriptionRecord | null>;

  /**
   * Resolve i18n fields per subscriber and deliver Web Push.
   * Dead endpoints (410/404) are pruned.
   */
  deliver(notification: PushNotification): Promise<void>;

  /** Low-level send used by deliver; exposed for tests. */
  sendToSubscription(
    subscription: PushSubscriptionRecord,
    payload: DeliveredPushPayload,
  ): Promise<"ok" | "gone">;
}
