import type { App } from "@hacado/types";
import { AppointmentNotificationsApp } from "./apps/appointment-notifications/app";
import { APPOINTMENT_NOTIFICATIONS_APP_NAME } from "./apps/appointment-notifications/const";
import { BlogApp } from "./apps/blog/app";
import { BLOG_APP_NAME } from "./apps/blog/const";
import { BusyEventsApp } from "./apps/busy-events/app";
import { BUSY_EVENTS_APP_NAME } from "./apps/busy-events/const";
import { CaldavApp } from "./apps/caldav/app";
import { CALDAV_APP_NAME } from "./apps/caldav/const";
import { CalendarWriterApp } from "./apps/calendar-writer/app";
import { CALENDAR_WRITER_APP_NAME } from "./apps/calendar-writer/const";
import { CarddavApp } from "./apps/carddav/app";
import { CARDDAV_APP_NAME } from "./apps/carddav/const";
import { CustomerEmailNotificationApp } from "./apps/customer-email-notification/app";
import { CUSTOMER_EMAIL_NOTIFICATION_APP_NAME } from "./apps/customer-email-notification/const";
import { CustomerPackageEmailNotificationApp } from "./apps/customer-package-email-notification/app";
import { CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME } from "./apps/customer-package-email-notification/const";
import { CustomerTextMessageNotificationApp } from "./apps/customer-text-message-notification/app";
import { CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "./apps/customer-text-message-notification/const";
import { CustomerWaitlistNotificationsApp } from "./apps/customer-waitlist-notifications/app";
import { CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME } from "./apps/customer-waitlist-notifications/const";
import { EmailNotificationApp } from "./apps/email-notification/app";
import { EMAIL_NOTIFICATION_APP_NAME } from "./apps/email-notification/const";
import { FormsApp } from "./apps/forms/app";
import { FORMS_APP_NAME } from "./apps/forms/const";
import { GiftCardStudioApp } from "./apps/gift-card-studio/app";
import { GIFT_CARD_STUDIO_APP_NAME } from "./apps/gift-card-studio/const";
import { GoogleCalendarApp } from "./apps/google-calendar/app";
import { GOOGLE_CALENDAR_APP_NAME } from "./apps/google-calendar/const";
import { IcsApp } from "./apps/ics/app";
import { ICS_APP_NAME } from "./apps/ics/const";
import { MyCabinetApp } from "./apps/my-cabinet/app";
import { MY_CABINET_APP_NAME } from "./apps/my-cabinet/const";
import { OutlookApp } from "./apps/outlook/app";
import { OUTLOOK_APP_NAME } from "./apps/outlook/const";
import { PaypalApp } from "./apps/paypal/app";
import { PAYPAL_APP_NAME } from "./apps/paypal/const";
import { SmartScheduleApp } from "./apps/smart-schedule/app";
import { SMART_SCHEDULE_APP_NAME } from "./apps/smart-schedule/const";
import { SmtpApp } from "./apps/smtp/app";
import { SMTP_APP_NAME } from "./apps/smtp/const";
import { SquareApp } from "./apps/square/app";
import { SQUARE_APP_NAME } from "./apps/square/const";
import { StripeApp } from "./apps/stripe/app";
import { STRIPE_APP_NAME } from "./apps/stripe/const";
import { TextBeltApp } from "./apps/text-belt/app";
import { TEXTBELT_APP_NAME } from "./apps/text-belt/const";
import { TextMessageAutoReplyApp } from "./apps/text-message-auto-reply/app";
import { TEXT_MESSAGE_AUTO_REPLY_APP_NAME } from "./apps/text-message-auto-reply/const";
import { TextMessageNotificationApp } from "./apps/text-message-notification/app";
import { TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "./apps/text-message-notification/const";
import { TextMessageResenderApp } from "./apps/text-message-resender/app";
import { TEXT_MESSAGE_RESENDER_APP_NAME } from "./apps/text-message-resender/const";
import { UrlBusyEventsApp } from "./apps/url-busy-events/app";
import { URL_BUSY_EVENTS_APP_NAME } from "./apps/url-busy-events/const";
import { UrlScheduleProviderApp } from "./apps/url-schedule-provider/app";
import { URL_SCHEDULE_PROVIDER_APP_NAME } from "./apps/url-schedule-provider/const";
import { WaitlistApp } from "./apps/waitlist/app";
import { WAITLIST_APP_NAME } from "./apps/waitlist/const";
import { webhooksApp } from "./apps/webhooks/app";
import { WEBHOOKS_APP_NAME } from "./apps/webhooks/const";
import { WeeklyScheduleApp } from "./apps/weekly-schedule/app";
import { WEEKLY_SCHEDULE_APP_NAME } from "./apps/weekly-schedule/const";
import { ZoomApp } from "./apps/zoom/app";
import { ZOOM_APP_NAME } from "./apps/zoom/const";

export const AvailableApps: Record<string, App> = {
  [OUTLOOK_APP_NAME]: OutlookApp,
  [GOOGLE_CALENDAR_APP_NAME]: GoogleCalendarApp,
  [ICS_APP_NAME]: IcsApp,
  [CALDAV_APP_NAME]: CaldavApp,
  [CARDDAV_APP_NAME]: CarddavApp,
  [SMTP_APP_NAME]: SmtpApp,
  [WEEKLY_SCHEDULE_APP_NAME]: WeeklyScheduleApp,
  [BUSY_EVENTS_APP_NAME]: BusyEventsApp,
  [TEXTBELT_APP_NAME]: TextBeltApp,
  [CUSTOMER_EMAIL_NOTIFICATION_APP_NAME]: CustomerEmailNotificationApp,
  [CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME]:
    CustomerPackageEmailNotificationApp,
  [EMAIL_NOTIFICATION_APP_NAME]: EmailNotificationApp,
  [CALENDAR_WRITER_APP_NAME]: CalendarWriterApp,
  [CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME]:
    CustomerTextMessageNotificationApp,
  [TEXT_MESSAGE_NOTIFICATION_APP_NAME]: TextMessageNotificationApp,
  [APPOINTMENT_NOTIFICATIONS_APP_NAME]: AppointmentNotificationsApp,
  // [FILE_SYSTEM_ASSETS_STORAGE_APP_NAME]: FileSystemAssetsStorageApp,
  // [S3_ASSETS_STORAGE_APP_NAME]: S3AssetsStorageApp,
  [TEXT_MESSAGE_AUTO_REPLY_APP_NAME]: TextMessageAutoReplyApp,
  [TEXT_MESSAGE_RESENDER_APP_NAME]: TextMessageResenderApp,
  [PAYPAL_APP_NAME]: PaypalApp,
  [SQUARE_APP_NAME]: SquareApp,
  [STRIPE_APP_NAME]: StripeApp,
  [BLOG_APP_NAME]: BlogApp,
  [WAITLIST_APP_NAME]: WaitlistApp,
  [CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME]: CustomerWaitlistNotificationsApp,
  [WEBHOOKS_APP_NAME]: webhooksApp,
  [SMART_SCHEDULE_APP_NAME]: SmartScheduleApp,
  [URL_BUSY_EVENTS_APP_NAME]: UrlBusyEventsApp,
  [URL_SCHEDULE_PROVIDER_APP_NAME]: UrlScheduleProviderApp,
  [ZOOM_APP_NAME]: ZoomApp,
  [FORMS_APP_NAME]: FormsApp,
  [GIFT_CARD_STUDIO_APP_NAME]: GiftCardStudioApp,
  [MY_CABINET_APP_NAME]: MyCabinetApp,
};

export { BLOG_APP_NAME } from "./apps/blog/const";
export { BUSY_EVENTS_APP_NAME } from "./apps/busy-events/const";
export { CALDAV_APP_NAME } from "./apps/caldav/const";
export { CALENDAR_WRITER_APP_NAME } from "./apps/calendar-writer/const";
export { CARDDAV_APP_NAME } from "./apps/carddav/const";
export { CUSTOMER_EMAIL_NOTIFICATION_APP_NAME } from "./apps/customer-email-notification/const";
export { CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME } from "./apps/customer-package-email-notification/const";
export { CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "./apps/customer-text-message-notification/const";
export { CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME } from "./apps/customer-waitlist-notifications/const";
export { EMAIL_NOTIFICATION_APP_NAME } from "./apps/email-notification/const";
// export { FILE_SYSTEM_ASSETS_STORAGE_APP_NAME } from "./apps/file-system-assets-storage/const";
export { GOOGLE_CALENDAR_APP_NAME } from "./apps/google-calendar/const";
export { ICS_APP_NAME } from "./apps/ics/const";
export { MY_CABINET_APP_NAME } from "./apps/my-cabinet/const";
export { OUTLOOK_APP_NAME } from "./apps/outlook/const";
export { PAYPAL_APP_NAME } from "./apps/paypal/const";
export { SQUARE_APP_NAME } from "./apps/square/const";
export { STRIPE_APP_NAME } from "./apps/stripe/const";
// export { S3_ASSETS_STORAGE_APP_NAME } from "./apps/s3-assets-storage/const";
export { APPOINTMENT_NOTIFICATIONS_APP_NAME } from "./apps/appointment-notifications/const";
export { FORMS_APP_NAME } from "./apps/forms/const";
export { GIFT_CARD_STUDIO_APP_NAME } from "./apps/gift-card-studio/const";
export { SMART_SCHEDULE_APP_NAME } from "./apps/smart-schedule/const";
export { SMTP_APP_NAME } from "./apps/smtp/const";
export { TEXTBELT_APP_NAME } from "./apps/text-belt/const";
export { TEXT_MESSAGE_AUTO_REPLY_APP_NAME } from "./apps/text-message-auto-reply/const";
export { TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "./apps/text-message-notification/const";
export { TEXT_MESSAGE_RESENDER_APP_NAME } from "./apps/text-message-resender/const";
export { URL_BUSY_EVENTS_APP_NAME } from "./apps/url-busy-events/const";
export { URL_SCHEDULE_PROVIDER_APP_NAME } from "./apps/url-schedule-provider/const";
export { WAITLIST_APP_NAME } from "./apps/waitlist/const";
export { WEBHOOKS_APP_NAME } from "./apps/webhooks/const";
export { WEEKLY_SCHEDULE_APP_NAME } from "./apps/weekly-schedule/const";
export { ZOOM_APP_NAME } from "./apps/zoom/const";
