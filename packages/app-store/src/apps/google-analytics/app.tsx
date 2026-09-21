import {
  App,
  APPOINTMENT_CREATED_EVENT_TYPE,
  BillingPlanTier,
  CUSTOMER_PACKAGE_ISSUED_EVENT_TYPE,
} from "@hacado/types";
import { FORM_RESPONSE_CREATED_EVENT_TYPE } from "../forms/models/events";
import { GIFT_CARD_STUDIO_PURCHASE_CREATED_EVENT_TYPE } from "../gift-card-studio/models/events";
import { WAITLIST_ENTRY_CREATED_EVENT_TYPE } from "../waitlist/models/events";
import { GOOGLE_ANALYTICS_APP_NAME } from "./const";
import { GoogleAnalyticsLogo } from "./logo";
import {
  GoogleAnalyticsAdminKeys,
  GoogleAnalyticsAdminNamespace,
} from "./translations/types";

export const GoogleAnalyticsApp: App<
  GoogleAnalyticsAdminNamespace,
  GoogleAnalyticsAdminKeys
> = {
  name: GOOGLE_ANALYTICS_APP_NAME,
  displayName: "app_google-analytics_admin.app.displayName",
  scope: [
    "script-provider",
    "event-subscriber",
    "public-event-context-provider",
  ],
  subscribeTo: [
    APPOINTMENT_CREATED_EVENT_TYPE,
    WAITLIST_ENTRY_CREATED_EVENT_TYPE,
    GIFT_CARD_STUDIO_PURCHASE_CREATED_EVENT_TYPE,
    CUSTOMER_PACKAGE_ISSUED_EVENT_TYPE,
    FORM_RESPONSE_CREATED_EVENT_TYPE,
  ],
  type: "oauth",
  target: "company",
  category: ["apps.categories.marketing", "apps.categories.content"],
  Logo: GoogleAnalyticsLogo,
  isFeatured: false,
  dontAllowMultiple: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_google-analytics_admin.app.description",
  },
};
