import { App, BillingPlanTier } from "@timelish/types";
import { URL_BUSY_EVENTS_APP_NAME } from "./const";
import { UrlBusyEventsLogo } from "./logo";
import {
  UrlBusyEventsAdminKeys,
  UrlBusyEventsAdminNamespace,
} from "./translations/types";

export const UrlBusyEventsApp: App<
  UrlBusyEventsAdminNamespace,
  UrlBusyEventsAdminKeys
> = {
  name: URL_BUSY_EVENTS_APP_NAME,
  displayName: "app_url-busy-events_admin.app.displayName",
  scope: ["calendar-read"],
  category: ["apps.categories.calendar"],
  type: "basic",
  target: "company",
  Logo: ({ className }) => <UrlBusyEventsLogo className={className} />,
  description: {
    text: "app_url-busy-events_admin.app.description",
  },
  minimumPlanTier: BillingPlanTier.Solo,
};
