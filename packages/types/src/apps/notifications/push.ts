import { AllKeys } from "@hacado/i18n";
import type { NotificationAudience } from "./audience";

export type PushNotificationText = {
  key: AllKeys;
  args?: Record<string, any>;
};

/** Action button on a push notification (Chromium; ignored on Safari/iOS). */
export type PushNotificationAction = {
  /** Stable id received as `event.action` in notificationclick. */
  action: string;
  title: PushNotificationText;
  /** Dashboard path opened when this action is clicked. */
  url: string;
};

/**
 * Payload built by EventDefinition.pushNotification.
 * Title/body stay as i18n keys until send time, when they are resolved
 * per recipient member language.
 */
export type PushNotification = {
  title: PushNotificationText;
  body: PushNotificationText;
  /** Dashboard deep link opened on notification click. */
  url?: string;
  /** Collapse related notifications in the OS tray. */
  tag?: string;
  /** When set, only matching members receive the push. */
  audience?: NotificationAudience;
  /**
   * Optional action buttons (max 2 used by Chromium).
   * Safari / iOS Home Screen apps ignore these.
   */
  actions?: PushNotificationAction[];
};

export type PushSubscriptionKeys = {
  p256dh: string;
  auth: string;
};

export type PushSubscriptionRecord = {
  _id: string;
  organizationId: string;
  memberId: string;
  userId: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
  expirationTime?: number | null;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertPushSubscriptionInput = {
  organizationId: string;
  memberId: string;
  userId: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
  expirationTime?: number | null;
  userAgent?: string;
};

export type DeliveredPushAction = {
  action: string;
  title: string;
  url: string;
};

/** Already-translated payload delivered to the browser service worker. */
export type DeliveredPushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  actions?: DeliveredPushAction[];
};

/**
 * Final delivery unit prepared by job-processor and enqueued for
 * notification-sender (one browser PushSubscription).
 */
export type PushNotificationRequest = {
  endpoint: string;
  keys: PushSubscriptionKeys;
  expirationTime?: number | null;
  memberId: string;
  payload: DeliveredPushPayload;
};
