import type {
  DeliveredPushPayload,
  PushNotification,
  PushNotificationRequest,
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
   * Resolve audience + per-member i18n into enqueueable delivery units.
   * Does not send Web Push; callers enqueue via notificationService.sendPush.
   */
  prepareDeliveries(
    notification: PushNotification,
  ): Promise<PushNotificationRequest[]>;

  /** Low-level send used by notification-sender; prunes via return value. */
  sendToSubscription(
    subscription: Pick<
      PushSubscriptionRecord,
      "endpoint" | "keys" | "expirationTime" | "memberId"
    >,
    payload: DeliveredPushPayload,
  ): Promise<"ok" | "gone">;
}
