import { AUTOMATIC_AI_DISCOVERY_APP_NAME } from "./apps/automatic-ai-discovery/const";
import { AutomaticAiDiscoveryImages } from "./apps/automatic-ai-discovery/images";
import { AUTOMATIC_STRUCTURED_DATA_APP_NAME } from "./apps/automatic-structured-data/const";
import { AutomaticStructuredDataImages } from "./apps/automatic-structured-data/images";
import { CALDAV_APP_NAME } from "./apps/caldav/const";
import { CaldavImages } from "./apps/caldav/images";
import { GOOGLE_ANALYTICS_APP_NAME } from "./apps/google-analytics/const";
import { GoogleAnalyticsImages } from "./apps/google-analytics/images";
import { GOOGLE_CALENDAR_APP_NAME } from "./apps/google-calendar/const";
import { GoogleCalendarImages } from "./apps/google-calendar/images";
import { OUTLOOK_APP_NAME } from "./apps/outlook/const";
import { OutlookImages } from "./apps/outlook/images";
import { PAYMENT_LINKS_APP_NAME } from "./apps/payment-links/const";
import { PaymentLinksImages } from "./apps/payment-links/images";
import { PAYPAL_APP_NAME } from "./apps/paypal/const";
import { PaypalImages } from "./apps/paypal/images";
import { RESEND_APP_NAME } from "./apps/resend/const";
import { ResendImages } from "./apps/resend/images";
import { SQUARE_APP_NAME } from "./apps/square/const";
import { SquareImages } from "./apps/square/images";
import { STRIPE_APP_NAME } from "./apps/stripe/const";
import { StripeImages } from "./apps/stripe/images";
import { TEXTBELT_APP_NAME } from "./apps/text-belt/const";
import { TextBeltImages } from "./apps/text-belt/images";
import { WAITLIST_APP_NAME } from "./apps/waitlist/const";
import { WaitlistImages } from "./apps/waitlist/images";
import { ZOOM_APP_NAME } from "./apps/zoom/const";
import { ZoomImages } from "./apps/zoom/images";

export const AppImages: Record<string, string[]> = {
  [CALDAV_APP_NAME]: CaldavImages,
  [GOOGLE_CALENDAR_APP_NAME]: GoogleCalendarImages,
  [OUTLOOK_APP_NAME]: OutlookImages,
  [PAYPAL_APP_NAME]: PaypalImages,
  [RESEND_APP_NAME]: ResendImages,
  [TEXTBELT_APP_NAME]: TextBeltImages,
  [WAITLIST_APP_NAME]: WaitlistImages,
  [ZOOM_APP_NAME]: ZoomImages,
  [SQUARE_APP_NAME]: SquareImages,
  [STRIPE_APP_NAME]: StripeImages,
  [AUTOMATIC_STRUCTURED_DATA_APP_NAME]: AutomaticStructuredDataImages,
  [AUTOMATIC_AI_DISCOVERY_APP_NAME]: AutomaticAiDiscoveryImages,
  [GOOGLE_ANALYTICS_APP_NAME]: GoogleAnalyticsImages,
  [PAYMENT_LINKS_APP_NAME]: PaymentLinksImages,
};
