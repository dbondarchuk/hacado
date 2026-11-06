import { APPOINTMENT_REMINDERS_APP_NAME } from "./apps/appointment-reminders/const";
import { AppointmentRemindersTranslations } from "./apps/appointment-reminders/translations";
import { AUTOMATIC_AI_DISCOVERY_APP_NAME } from "./apps/automatic-ai-discovery/const";
import { AutomaticAiDiscoveryTranslations } from "./apps/automatic-ai-discovery/translations";
import { AUTOMATIC_STRUCTURED_DATA_APP_NAME } from "./apps/automatic-structured-data/const";
import { AutomaticStructuredDataTranslations } from "./apps/automatic-structured-data/translations";
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
import { CUSTOM_SCRIPTS_APP_NAME } from "./apps/custom-scripts/const";
import { CustomScriptsTranslations } from "./apps/custom-scripts/translations";
import { CUSTOMER_APPOINTMENT_UPDATES_APP_NAME } from "./apps/customer-appointment-updates/const";
import { CustomerAppointmentUpdatesTranslations } from "./apps/customer-appointment-updates/translations";
import { CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME } from "./apps/customer-package-email-notification/const";
import { CustomerPackageEmailNotificationTranslations } from "./apps/customer-package-email-notification/translations";
import { CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME } from "./apps/customer-waitlist-notifications/const";
import { CustomerWaitlistNotificationsTranslations } from "./apps/customer-waitlist-notifications/translations";
import { FORMS_APP_NAME } from "./apps/forms/const";
import { FormsTranslations } from "./apps/forms/translations";
import { GIFT_CARD_STUDIO_APP_NAME } from "./apps/gift-card-studio/const";
import { GiftCardStudioTranslations } from "./apps/gift-card-studio/translations";
import { GOOGLE_ANALYTICS_APP_NAME } from "./apps/google-analytics/const";
import { GoogleAnalyticsTranslations } from "./apps/google-analytics/translations";
import { GOOGLE_CALENDAR_APP_NAME } from "./apps/google-calendar/const";
import { GoogleCalendarTranslations } from "./apps/google-calendar/translations";
import { ICS_APP_NAME } from "./apps/ics/const";
import { IcsTranslations } from "./apps/ics/translations";
import { MY_APPOINTMENT_NOTIFICATIONS_APP_NAME } from "./apps/my-appointment-notifications/const";
import { MyAppointmentNotificationsTranslations } from "./apps/my-appointment-notifications/translations";
import { MY_CABINET_APP_NAME } from "./apps/my-cabinet/const";
import { MyCabinetTranslations } from "./apps/my-cabinet/translations";
import { OUTLOOK_APP_NAME } from "./apps/outlook/const";
import { OutlookTranslations } from "./apps/outlook/translations";
import { PAYMENT_LINKS_APP_NAME } from "./apps/payment-links/const";
import { PaymentLinksTranslations } from "./apps/payment-links/translations";
import { PAYPAL_APP_NAME } from "./apps/paypal/const";
import { PaypalTranslations } from "./apps/paypal/translations";
import { RESEND_APP_NAME } from "./apps/resend/const";
import { ResendTranslations } from "./apps/resend/translations";
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
import { TEXT_MESSAGE_FORWARDING_APP_NAME } from "./apps/text-message-forwarding/const";
import { TextMessageForwardingTranslations } from "./apps/text-message-forwarding/translations";
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
  [CUSTOMER_APPOINTMENT_UPDATES_APP_NAME]:
    CustomerAppointmentUpdatesTranslations,
  [CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME]:
    CustomerPackageEmailNotificationTranslations,
  [MY_APPOINTMENT_NOTIFICATIONS_APP_NAME]:
    MyAppointmentNotificationsTranslations,
  [GOOGLE_CALENDAR_APP_NAME]: GoogleCalendarTranslations,
  [GOOGLE_ANALYTICS_APP_NAME]: GoogleAnalyticsTranslations,
  [ICS_APP_NAME]: IcsTranslations,
  [OUTLOOK_APP_NAME]: OutlookTranslations,
  [PAYPAL_APP_NAME]: PaypalTranslations,
  [PAYMENT_LINKS_APP_NAME]: PaymentLinksTranslations,
  [SQUARE_APP_NAME]: SquareTranslations,
  [STRIPE_APP_NAME]: StripeTranslations,
  [APPOINTMENT_REMINDERS_APP_NAME]: AppointmentRemindersTranslations,
  [SMTP_APP_NAME]: SmtpTranslations,
  [RESEND_APP_NAME]: ResendTranslations,
  [TEXTBELT_APP_NAME]: TextBeltTranslations,
  [TEXT_MESSAGE_AUTO_REPLY_APP_NAME]: TextMessageAutoReplyTranslations,
  [TEXT_MESSAGE_FORWARDING_APP_NAME]: TextMessageForwardingTranslations,
  [WEEKLY_SCHEDULE_APP_NAME]: WeeklyScheduleTranslations,
  [WEBHOOKS_APP_NAME]: WebhooksTranslations,
  [SMART_SCHEDULE_APP_NAME]: SmartScheduleTranslations,
  [URL_BUSY_EVENTS_APP_NAME]: UrlBusyEventsTranslations,
  [URL_SCHEDULE_PROVIDER_APP_NAME]: UrlScheduleProviderTranslations,
  [ZOOM_APP_NAME]: ZoomTranslations,
  [FORMS_APP_NAME]: FormsTranslations,
  [GIFT_CARD_STUDIO_APP_NAME]: GiftCardStudioTranslations,
  [MY_CABINET_APP_NAME]: MyCabinetTranslations,
  [AUTOMATIC_STRUCTURED_DATA_APP_NAME]: AutomaticStructuredDataTranslations,
  [AUTOMATIC_AI_DISCOVERY_APP_NAME]: AutomaticAiDiscoveryTranslations,
  [CUSTOM_SCRIPTS_APP_NAME]: CustomScriptsTranslations,
};
