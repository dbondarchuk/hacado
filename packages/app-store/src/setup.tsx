import { BasicAppSetup } from "@hacado/types";

// Import all setup components
import { BlogAppSetup } from "./apps/blog/setup";
import { CaldavAppSetup } from "./apps/caldav/setup";
import { CalendarWriterAppSetup } from "./apps/calendar-writer/setup";
import { CarddavAppSetup } from "./apps/carddav/setup";
import { EmailNotificationAppSetup } from "./apps/email-notification/setup";
import { GoogleAppSetup } from "./apps/google-calendar/setup";
import { IcsAppSetup } from "./apps/ics/setup";
import { MyCabinetAppSetup } from "./apps/my-cabinet/setup";
import { OutlookAppSetup } from "./apps/outlook/setup";
import { PaypalAppSetup } from "./apps/paypal/setup";
import { SmartScheduleAppSetup } from "./apps/smart-schedule/setup";
import { SquareAppSetup } from "./apps/square/setup";
import { StripeAppSetup } from "./apps/stripe/setup";
import { TextBeltAppSetup } from "./apps/text-belt/setup";
import { TextMessageAutoReplyAppSetup } from "./apps/text-message-auto-reply/setup";
import { TextMessageNotificationAppSetup } from "./apps/text-message-notification/setup";
import { TextMessageResenderAppSetup } from "./apps/text-message-resender/setup";
import { UrlBusyEventsAppSetup } from "./apps/url-busy-events/setup";
import { UrlScheduleProviderAppSetup } from "./apps/url-schedule-provider/setup";
import { WaitlistNotificationsAppSetup } from "./apps/waitlist-notifications/setup";
import { WebhooksAppSetup } from "./apps/webhooks/setup";
import { ZoomAppSetup } from "./apps/zoom/setup";

// Import app name constants
import { BLOG_APP_NAME } from "./apps/blog/const";
import { CALDAV_APP_NAME } from "./apps/caldav/const";
import { CALENDAR_WRITER_APP_NAME } from "./apps/calendar-writer/const";
import { CARDDAV_APP_NAME } from "./apps/carddav/const";
import { EMAIL_NOTIFICATION_APP_NAME } from "./apps/email-notification/const";
import { GOOGLE_CALENDAR_APP_NAME } from "./apps/google-calendar/const";
import { ICS_APP_NAME } from "./apps/ics/const";
import { MY_CABINET_APP_NAME } from "./apps/my-cabinet/const";
import { OUTLOOK_APP_NAME } from "./apps/outlook/const";
import { PAYPAL_APP_NAME } from "./apps/paypal/const";
import { SMART_SCHEDULE_APP_NAME } from "./apps/smart-schedule/const";
import { SQUARE_APP_NAME } from "./apps/square/const";
import { STRIPE_APP_NAME } from "./apps/stripe/const";
import { TEXTBELT_APP_NAME } from "./apps/text-belt/const";
import { TEXT_MESSAGE_AUTO_REPLY_APP_NAME } from "./apps/text-message-auto-reply/const";
import { TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "./apps/text-message-notification/const";
import { TEXT_MESSAGE_RESENDER_APP_NAME } from "./apps/text-message-resender/const";
import { URL_BUSY_EVENTS_APP_NAME } from "./apps/url-busy-events/const";
import { URL_SCHEDULE_PROVIDER_APP_NAME } from "./apps/url-schedule-provider/const";
import { WAITLIST_NOTIFICATIONS_APP_NAME } from "./apps/waitlist-notifications/const";
import { WEBHOOKS_APP_NAME } from "./apps/webhooks/const";
import { ZOOM_APP_NAME } from "./apps/zoom/const";

export const AppSetups: Record<string, BasicAppSetup> = {
  [CALDAV_APP_NAME]: (props) => <CaldavAppSetup {...props} />,
  [CARDDAV_APP_NAME]: (props) => <CarddavAppSetup {...props} />,
  [CALENDAR_WRITER_APP_NAME]: (props) => <CalendarWriterAppSetup {...props} />,
  [EMAIL_NOTIFICATION_APP_NAME]: (props) => (
    <EmailNotificationAppSetup {...props} />
  ),
  [GOOGLE_CALENDAR_APP_NAME]: (props) => <GoogleAppSetup {...props} />,
  [ICS_APP_NAME]: (props) => <IcsAppSetup {...props} />,
  [OUTLOOK_APP_NAME]: (props) => <OutlookAppSetup {...props} />,
  [PAYPAL_APP_NAME]: (props) => <PaypalAppSetup {...props} />,
  [SQUARE_APP_NAME]: (props) => <SquareAppSetup {...props} />,
  [STRIPE_APP_NAME]: (props) => <StripeAppSetup {...props} />,
  [SMART_SCHEDULE_APP_NAME]: (props) => <SmartScheduleAppSetup {...props} />,
  [TEXTBELT_APP_NAME]: (props) => <TextBeltAppSetup {...props} />,
  [TEXT_MESSAGE_AUTO_REPLY_APP_NAME]: (props) => (
    <TextMessageAutoReplyAppSetup {...props} />
  ),
  [TEXT_MESSAGE_NOTIFICATION_APP_NAME]: (props) => (
    <TextMessageNotificationAppSetup {...props} />
  ),
  [TEXT_MESSAGE_RESENDER_APP_NAME]: (props) => (
    <TextMessageResenderAppSetup {...props} />
  ),
  [URL_BUSY_EVENTS_APP_NAME]: (props) => <UrlBusyEventsAppSetup {...props} />,
  [URL_SCHEDULE_PROVIDER_APP_NAME]: (props) => (
    <UrlScheduleProviderAppSetup {...props} />
  ),
  [BLOG_APP_NAME]: (props) => <BlogAppSetup {...props} />,
  [WAITLIST_NOTIFICATIONS_APP_NAME]: (props) => (
    <WaitlistNotificationsAppSetup {...props} />
  ),
  [WEBHOOKS_APP_NAME]: (props) => <WebhooksAppSetup {...props} />,
  [ZOOM_APP_NAME]: (props) => <ZoomAppSetup {...props} />,
  [MY_CABINET_APP_NAME]: (props) => <MyCabinetAppSetup {...props} />,
};
