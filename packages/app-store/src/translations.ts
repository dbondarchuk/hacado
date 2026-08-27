import { APPOINTMENT_NOTIFICATIONS_APP_NAME } from "./apps/appointment-notifications/const";
import { AppointmentNotificationsTranslations } from "./apps/appointment-notifications/translations";
import { BLOG_APP_NAME } from "./apps/blog/const";
import { BlogTranslations } from "./apps/blog/translations";
import { BUSY_EVENTS_APP_NAME } from "./apps/busy-events/const";
import { BusyEventsTranslations } from "./apps/busy-events/translations";
import { CALDAV_APP_NAME } from "./apps/caldav/const";
import { CaldavTranslations } from "./apps/caldav/translations";
import { CALENDAR_WRITER_APP_NAME } from "./apps/calendar-writer/const";
import { CalendarWriterTranslations } from "./apps/calendar-writer/translations";
import { CARDDAV_APP_NAME } from "./apps/carddav/const";
import { CarddavTranslations } from "./apps/carddav/translations";
import { CUSTOMER_EMAIL_NOTIFICATION_APP_NAME } from "./apps/customer-email-notification/const";
import { CustomerEmailNotificationTranslations } from "./apps/customer-email-notification/translations";
import { CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME } from "./apps/customer-package-email-notification/const";
import { CustomerPackageEmailNotificationTranslations } from "./apps/customer-package-email-notification/translations";
import { CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "./apps/customer-text-message-notification/const";
import { CustomerTextMessageNotificationTranslations } from "./apps/customer-text-message-notification/translations";
import { CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME } from "./apps/customer-waitlist-notifications/const";
import { CustomerWaitlistNotificationsTranslations } from "./apps/customer-waitlist-notifications/translations";
import { EMAIL_NOTIFICATION_APP_NAME } from "./apps/email-notification/const";
import { EmailNotificationTranslations } from "./apps/email-notification/translations";
import { FORMS_APP_NAME } from "./apps/forms/const";
import { FormsTranslations } from "./apps/forms/translations";
import { GIFT_CARD_STUDIO_APP_NAME } from "./apps/gift-card-studio/const";
import { GiftCardStudioTranslations } from "./apps/gift-card-studio/translations";
import { GOOGLE_CALENDAR_APP_NAME } from "./apps/google-calendar/const";
import { GoogleCalendarTranslations } from "./apps/google-calendar/translations";
import { ICS_APP_NAME } from "./apps/ics/const";
import { IcsTranslations } from "./apps/ics/translations";
import { MY_CABINET_APP_NAME } from "./apps/my-cabinet/const";
import { MyCabinetTranslations } from "./apps/my-cabinet/translations";
import { OUTLOOK_APP_NAME } from "./apps/outlook/const";
import { OutlookTranslations } from "./apps/outlook/translations";
import { PAYPAL_APP_NAME } from "./apps/paypal/const";
import { PaypalTranslations } from "./apps/paypal/translations";
import { SMART_SCHEDULE_APP_NAME } from "./apps/smart-schedule/const";
import { SmartScheduleTranslations } from "./apps/smart-schedule/translations";
import { SMTP_APP_NAME } from "./apps/smtp/const";
import { SmtpTranslations } from "./apps/smtp/translations";
import { SQUARE_APP_NAME } from "./apps/square/const";
import { SquareTranslations } from "./apps/square/translations";
import { STRIPE_APP_NAME } from "./apps/stripe/const";
import { StripeTranslations } from "./apps/stripe/translations";
import { TEXTBELT_APP_NAME } from "./apps/text-belt/const";
import { TextBeltTranslations } from "./apps/text-belt/translations";
import { TEXT_MESSAGE_AUTO_REPLY_APP_NAME } from "./apps/text-message-auto-reply/const";
import { TextMessageAutoReplyTranslations } from "./apps/text-message-auto-reply/translations";
import { TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "./apps/text-message-notification/const";
import { TextMessageNotificationTranslations } from "./apps/text-message-notification/translations";
import { TEXT_MESSAGE_RESENDER_APP_NAME } from "./apps/text-message-resender/const";
import { TextMessageResenderTranslations } from "./apps/text-message-resender/translations";
import { URL_BUSY_EVENTS_APP_NAME } from "./apps/url-busy-events/const";
import { UrlBusyEventsTranslations } from "./apps/url-busy-events/translations";
import { URL_SCHEDULE_PROVIDER_APP_NAME } from "./apps/url-schedule-provider/const";
import { UrlScheduleProviderTranslations } from "./apps/url-schedule-provider/translations";
import { WAITLIST_APP_NAME } from "./apps/waitlist/const";
import { WaitlistTranslations } from "./apps/waitlist/translations";
import { WEBHOOKS_APP_NAME } from "./apps/webhooks/const";
import { WebhooksTranslations } from "./apps/webhooks/translations";
import { WEEKLY_SCHEDULE_APP_NAME } from "./apps/weekly-schedule/const";
import { WeeklyScheduleTranslations } from "./apps/weekly-schedule/translations";
import { ZOOM_APP_NAME } from "./apps/zoom/const";
import { ZoomTranslations } from "./apps/zoom/translations";

export const AppsTranslations: Record<
  string,
  {
    admin?: (locale: string) => Promise<Record<string, any>>;
    public?: (locale: string) => Promise<Record<string, any>>;
    overrides?: (locale: string) => Promise<Record<string, any>>;
  }
> = {
  [WAITLIST_APP_NAME]: WaitlistTranslations,
  [CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME]:
    CustomerWaitlistNotificationsTranslations,
  [BLOG_APP_NAME]: BlogTranslations,
  [BUSY_EVENTS_APP_NAME]: BusyEventsTranslations,
  [CALDAV_APP_NAME]: CaldavTranslations,
  [CARDDAV_APP_NAME]: CarddavTranslations,
  [CALENDAR_WRITER_APP_NAME]: CalendarWriterTranslations,
  [CUSTOMER_EMAIL_NOTIFICATION_APP_NAME]: CustomerEmailNotificationTranslations,
  [CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME]:
    CustomerPackageEmailNotificationTranslations,
  [CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME]:
    CustomerTextMessageNotificationTranslations,
  [EMAIL_NOTIFICATION_APP_NAME]: EmailNotificationTranslations,
  [GOOGLE_CALENDAR_APP_NAME]: GoogleCalendarTranslations,
  [ICS_APP_NAME]: IcsTranslations,
  [OUTLOOK_APP_NAME]: OutlookTranslations,
  [PAYPAL_APP_NAME]: PaypalTranslations,
  [SQUARE_APP_NAME]: SquareTranslations,
  [STRIPE_APP_NAME]: StripeTranslations,
  [APPOINTMENT_NOTIFICATIONS_APP_NAME]: AppointmentNotificationsTranslations,
  [SMTP_APP_NAME]: SmtpTranslations,
  [TEXTBELT_APP_NAME]: TextBeltTranslations,
  [TEXT_MESSAGE_AUTO_REPLY_APP_NAME]: TextMessageAutoReplyTranslations,
  [TEXT_MESSAGE_NOTIFICATION_APP_NAME]: TextMessageNotificationTranslations,
  [TEXT_MESSAGE_RESENDER_APP_NAME]: TextMessageResenderTranslations,
  [WEEKLY_SCHEDULE_APP_NAME]: WeeklyScheduleTranslations,
  [WEBHOOKS_APP_NAME]: WebhooksTranslations,
  [SMART_SCHEDULE_APP_NAME]: SmartScheduleTranslations,
  [URL_BUSY_EVENTS_APP_NAME]: UrlBusyEventsTranslations,
  [URL_SCHEDULE_PROVIDER_APP_NAME]: UrlScheduleProviderTranslations,
  [ZOOM_APP_NAME]: ZoomTranslations,
  [FORMS_APP_NAME]: FormsTranslations,
  [GIFT_CARD_STUDIO_APP_NAME]: GiftCardStudioTranslations,
  [MY_CABINET_APP_NAME]: MyCabinetTranslations,
};
