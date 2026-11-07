import { activityHandler } from "./activity-handler";
import { appsHandler } from "./apps-handler";
import { customerPackagePaymentHandler } from "./customer-package-payment-handler";
import { dashboardNotificationHandler } from "./dashboard-notification-handler";
import { giftCardPaymentHandler } from "./gift-card-payment-handler";
import { notificationHandler } from "./notification-handler";
import { pushNotificationHandler } from "./push-notification-handler";
import { smsProfileNumberHandler } from "./sms-profile-number-handler";
import type { EventHandler } from "./types";

export const eventHandlers: EventHandler[] = [
  activityHandler,
  dashboardNotificationHandler,
  pushNotificationHandler,
  notificationHandler,
  appsHandler,
  smsProfileNumberHandler,
  giftCardPaymentHandler,
  customerPackagePaymentHandler,
];

export type { EventHandler, EventHandlerContext } from "./types";
