import { AppMenuItem } from "@hacado/types";
import { APPOINTMENT_NOTIFICATIONS_APP_NAME } from "./apps/appointment-notifications/const";
import { AppointmentNotificationsMenuItems } from "./apps/appointment-notifications/menu-items";
import { BLOG_APP_NAME } from "./apps/blog/const";
import { BlogMenuItems } from "./apps/blog/menu-items";
import { BUSY_EVENTS_APP_NAME } from "./apps/busy-events/const";
import { BusyEventsMenuItems } from "./apps/busy-events/menu-items";
import { CUSTOMER_EMAIL_NOTIFICATION_APP_NAME } from "./apps/customer-email-notification/const";
import { CustomerEmailNotificationMenuItems } from "./apps/customer-email-notification/menu-items";
import { CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "./apps/customer-text-message-notification/const";
import { CustomerTextMessageNotificationMenuItems } from "./apps/customer-text-message-notification/menu-items";
import { FORMS_APP_NAME } from "./apps/forms/const";
import { FormsMenuItems } from "./apps/forms/menu-items";
import { GIFT_CARD_STUDIO_APP_NAME } from "./apps/gift-card-studio/const";
import { GiftCardStudioMenuItems } from "./apps/gift-card-studio/menu-items";
import { SMTP_APP_NAME } from "./apps/smtp/const";
import { SmtpMenuItems } from "./apps/smtp/menu-items";
import { WAITLIST_APP_NAME } from "./apps/waitlist/const";
import { WaitlistMenuItems } from "./apps/waitlist/menu-items";
import { WEEKLY_SCHEDULE_APP_NAME } from "./apps/weekly-schedule/const";
import { WeeklyScheduleMenuItems } from "./apps/weekly-schedule/menu-items";

export const AppMenuItems: Record<string, AppMenuItem[]> = {
  [BLOG_APP_NAME]: BlogMenuItems,
  [BUSY_EVENTS_APP_NAME]: BusyEventsMenuItems,
  [CUSTOMER_EMAIL_NOTIFICATION_APP_NAME]: CustomerEmailNotificationMenuItems,
  [CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME]:
    CustomerTextMessageNotificationMenuItems,
  [WAITLIST_APP_NAME]: WaitlistMenuItems,
  [SMTP_APP_NAME]: SmtpMenuItems,
  [WEEKLY_SCHEDULE_APP_NAME]: WeeklyScheduleMenuItems,
  [APPOINTMENT_NOTIFICATIONS_APP_NAME]: AppointmentNotificationsMenuItems,
  [FORMS_APP_NAME]: FormsMenuItems,
  [GIFT_CARD_STUDIO_APP_NAME]: GiftCardStudioMenuItems,
};
