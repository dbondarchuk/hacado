import { AppMenuItem } from "@hacado/types/apps";
import { APPOINTMENT_REMINDERS_APP_NAME } from "./apps/appointment-reminders/const";
import { AppointmentRemindersMenuItems } from "./apps/appointment-reminders/menu-items";
import { BLOG_APP_NAME } from "./apps/blog/const";
import { BlogMenuItems } from "./apps/blog/menu-items";
import { BUSY_EVENTS_APP_NAME } from "./apps/busy-events/const";
import { BusyEventsMenuItems } from "./apps/busy-events/menu-items";
import { CUSTOM_SCRIPTS_APP_NAME } from "./apps/custom-scripts/const";
import { CustomScriptsMenuItems } from "./apps/custom-scripts/menu-items";
import { CUSTOMER_APPOINTMENT_UPDATES_APP_NAME } from "./apps/customer-appointment-updates/const";
import { CustomerAppointmentUpdatesMenuItems } from "./apps/customer-appointment-updates/menu-items";
import { CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME } from "./apps/customer-package-email-notification/const";
import { CustomerPackageEmailNotificationMenuItems } from "./apps/customer-package-email-notification/menu-items";
import { CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME } from "./apps/customer-waitlist-notifications/const";
import { CustomerWaitlistNotificationsMenuItems } from "./apps/customer-waitlist-notifications/menu-items";
import { FORMS_APP_NAME } from "./apps/forms/const";
import { FormsMenuItems } from "./apps/forms/menu-items";
import { GIFT_CARD_STUDIO_APP_NAME } from "./apps/gift-card-studio/const";
import { GiftCardStudioMenuItems } from "./apps/gift-card-studio/menu-items";
import { MY_APPOINTMENT_NOTIFICATIONS_APP_NAME } from "./apps/my-appointment-notifications/const";
import { MyAppointmentNotificationsMenuItems } from "./apps/my-appointment-notifications/menu-items";
import { WAITLIST_APP_NAME } from "./apps/waitlist/const";
import { WaitlistMenuItems } from "./apps/waitlist/menu-items";
import { WEEKLY_SCHEDULE_APP_NAME } from "./apps/weekly-schedule/const";
import { WeeklyScheduleMenuItems } from "./apps/weekly-schedule/menu-items";

export const AppMenuItems: Record<string, AppMenuItem[]> = {
  [BLOG_APP_NAME]: BlogMenuItems,
  [BUSY_EVENTS_APP_NAME]: BusyEventsMenuItems,
  [CUSTOMER_APPOINTMENT_UPDATES_APP_NAME]: CustomerAppointmentUpdatesMenuItems,
  [CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME]:
    CustomerPackageEmailNotificationMenuItems,
  [MY_APPOINTMENT_NOTIFICATIONS_APP_NAME]: MyAppointmentNotificationsMenuItems,
  [CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME]:
    CustomerWaitlistNotificationsMenuItems,
  [CUSTOM_SCRIPTS_APP_NAME]: CustomScriptsMenuItems,
  [WAITLIST_APP_NAME]: WaitlistMenuItems,
  [WEEKLY_SCHEDULE_APP_NAME]: WeeklyScheduleMenuItems,
  [APPOINTMENT_REMINDERS_APP_NAME]: AppointmentRemindersMenuItems,
  [FORMS_APP_NAME]: FormsMenuItems,
  [GIFT_CARD_STUDIO_APP_NAME]: GiftCardStudioMenuItems,
};
