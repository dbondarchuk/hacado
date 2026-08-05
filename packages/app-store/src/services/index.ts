import { IConnectedApp, IConnectedAppProps } from "@hacado/types";
import { APPOINTMENT_NOTIFICATIONS_APP_NAME } from "../apps/appointment-notifications/const";
import ScheduledNotificationsConnectedApp from "../apps/appointment-notifications/service";
import { BLOG_APP_NAME } from "../apps/blog/const";
import { BlogConnectedApp } from "../apps/blog/service/service";
import { BUSY_EVENTS_APP_NAME } from "../apps/busy-events/const";
import BusyEventsConnectedApp from "../apps/busy-events/service";
import { CALDAV_APP_NAME } from "../apps/caldav/const";
import CaldavConnectedApp from "../apps/caldav/service";
import { CALENDAR_WRITER_APP_NAME } from "../apps/calendar-writer/const";
import { CalendarWriterConnectedApp } from "../apps/calendar-writer/service";
import { CARDDAV_APP_NAME } from "../apps/carddav/const";
import CarddavConnectedApp from "../apps/carddav/service";
import { CUSTOMER_EMAIL_NOTIFICATION_APP_NAME } from "../apps/customer-email-notification/const";
import CustomerEmailNotificationConnectedApp from "../apps/customer-email-notification/service";
import { CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "../apps/customer-text-message-notification/const";
import CustomerTextMessageNotificationConnectedApp from "../apps/customer-text-message-notification/service";
import { EMAIL_NOTIFICATION_APP_NAME } from "../apps/email-notification/const";
import { EmailNotificationConnectedApp } from "../apps/email-notification/service";
import { FORMS_APP_NAME } from "../apps/forms/const";
import { FormsConnectedApp } from "../apps/forms/service";
import { GIFT_CARD_STUDIO_APP_NAME } from "../apps/gift-card-studio/const";
import { GiftCardStudioConnectedApp } from "../apps/gift-card-studio/service/service";
import { GOOGLE_CALENDAR_APP_NAME } from "../apps/google-calendar/const";
import GoogleCalendarConnectedApp from "../apps/google-calendar/service";
import { ICS_APP_NAME } from "../apps/ics/const";
import IcsConnectedApp from "../apps/ics/service";
import { MY_CABINET_APP_NAME } from "../apps/my-cabinet/const";
import { MyCabinetConnectedApp } from "../apps/my-cabinet/service";
import { OUTLOOK_APP_NAME } from "../apps/outlook/const";
import OutlookConnectedApp from "../apps/outlook/service";
import { PAYPAL_APP_NAME } from "../apps/paypal/const";
import PaypalConnectedApp from "../apps/paypal/service";
import { SQUARE_APP_NAME } from "../apps/square/const";
import SquareConnectedApp from "../apps/square/service";
import { STRIPE_APP_NAME } from "../apps/stripe/const";
import StripeConnectedApp from "../apps/stripe/service";
import { SMART_SCHEDULE_APP_NAME } from "../apps/smart-schedule/const";
import SmartScheduleConnectedApp from "../apps/smart-schedule/service";
import { SMTP_APP_NAME } from "../apps/smtp/const";
import SmtpConnectedApp from "../apps/smtp/service";
import { TEXTBELT_APP_NAME } from "../apps/text-belt/const";
import TextBeltConnectedApp from "../apps/text-belt/service";
import { TEXT_MESSAGE_AUTO_REPLY_APP_NAME } from "../apps/text-message-auto-reply/const";
import TextMessageAutoReplyConnectedApp from "../apps/text-message-auto-reply/service";
import { TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "../apps/text-message-notification/const";
import { TextMessageNotificationConnectedApp } from "../apps/text-message-notification/service";
import { TEXT_MESSAGE_RESENDER_APP_NAME } from "../apps/text-message-resender/const";
import TextMessageResenderConnectedApp from "../apps/text-message-resender/service";
import { URL_BUSY_EVENTS_APP_NAME } from "../apps/url-busy-events/const";
import UrlBusyEventsConnectedApp from "../apps/url-busy-events/service";
import { URL_SCHEDULE_PROVIDER_APP_NAME } from "../apps/url-schedule-provider/const";
import UrlScheduleProviderConnectedApp from "../apps/url-schedule-provider/service";
import { WAITLIST_NOTIFICATIONS_APP_NAME } from "../apps/waitlist-notifications/const";
import { WaitlistNotificationsConnectedApp } from "../apps/waitlist-notifications/service";
import { WAITLIST_APP_NAME } from "../apps/waitlist/const";
import { WaitlistConnectedApp } from "../apps/waitlist/service/service";
import { WEBHOOKS_APP_NAME } from "../apps/webhooks/const";
import { WebhooksConnectedApp } from "../apps/webhooks/service";
import { WEEKLY_SCHEDULE_APP_NAME } from "../apps/weekly-schedule/const";
import WeeklyScheduleConnectedApp from "../apps/weekly-schedule/service";
import { ZOOM_APP_NAME } from "../apps/zoom/const";
import { ZoomConnectedApp } from "../apps/zoom/service";

export const AvailableAppServices: Record<
  string,
  (props: IConnectedAppProps) => IConnectedApp
> = {
  [OUTLOOK_APP_NAME]: (props) => new OutlookConnectedApp(props),
  [GOOGLE_CALENDAR_APP_NAME]: (props) => new GoogleCalendarConnectedApp(props),
  [ICS_APP_NAME]: (props) => new IcsConnectedApp(props),
  [CALDAV_APP_NAME]: (props) => new CaldavConnectedApp(props),
  [CARDDAV_APP_NAME]: (props) => new CarddavConnectedApp(props),
  [WEEKLY_SCHEDULE_APP_NAME]: (props) => new WeeklyScheduleConnectedApp(props),
  [BUSY_EVENTS_APP_NAME]: (props) => new BusyEventsConnectedApp(props),
  [SMTP_APP_NAME]: (props) => new SmtpConnectedApp(props),
  [TEXTBELT_APP_NAME]: (props) => new TextBeltConnectedApp(props),
  [CUSTOMER_EMAIL_NOTIFICATION_APP_NAME]: (props) =>
    new CustomerEmailNotificationConnectedApp(props),
  [EMAIL_NOTIFICATION_APP_NAME]: (props) =>
    new EmailNotificationConnectedApp(props),
  [CALENDAR_WRITER_APP_NAME]: (props) => new CalendarWriterConnectedApp(props),
  [CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME]: (props) =>
    new CustomerTextMessageNotificationConnectedApp(props),
  [TEXT_MESSAGE_NOTIFICATION_APP_NAME]: (props) =>
    new TextMessageNotificationConnectedApp(props),
  [TEXT_MESSAGE_AUTO_REPLY_APP_NAME]: (props) =>
    new TextMessageAutoReplyConnectedApp(props),
  [TEXT_MESSAGE_RESENDER_APP_NAME]: (props) =>
    new TextMessageResenderConnectedApp(props),
  [APPOINTMENT_NOTIFICATIONS_APP_NAME]: (props) =>
    new ScheduledNotificationsConnectedApp(props),
  [PAYPAL_APP_NAME]: (props) => new PaypalConnectedApp(props),
  [SQUARE_APP_NAME]: (props) => new SquareConnectedApp(props),
  [STRIPE_APP_NAME]: (props) => new StripeConnectedApp(props),
  [BLOG_APP_NAME]: (props) => new BlogConnectedApp(props),
  [WAITLIST_APP_NAME]: (props) => new WaitlistConnectedApp(props),
  [WAITLIST_NOTIFICATIONS_APP_NAME]: (props) =>
    new WaitlistNotificationsConnectedApp(props),
  [WEBHOOKS_APP_NAME]: (props) => new WebhooksConnectedApp(props),
  [SMART_SCHEDULE_APP_NAME]: (props) => new SmartScheduleConnectedApp(props),
  [URL_BUSY_EVENTS_APP_NAME]: (props) => new UrlBusyEventsConnectedApp(props),
  [URL_SCHEDULE_PROVIDER_APP_NAME]: (props) =>
    new UrlScheduleProviderConnectedApp(props),
  [ZOOM_APP_NAME]: (props) => new ZoomConnectedApp(props),
  [FORMS_APP_NAME]: (props) => new FormsConnectedApp(props),
  [GIFT_CARD_STUDIO_APP_NAME]: (props) => new GiftCardStudioConnectedApp(props),
  [MY_CABINET_APP_NAME]: (props) => new MyCabinetConnectedApp(props),
};
export { AvailableApps as ServiceAvailableApps } from "../apps";
