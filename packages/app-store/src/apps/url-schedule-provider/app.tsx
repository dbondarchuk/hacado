import { App, BillingPlanTier } from "@hacado/types";
import { URL_SCHEDULE_PROVIDER_APP_NAME } from "./const";
import { UrlScheduleProviderLogo } from "./logo";
import {
  UrlScheduleProviderAdminKeys,
  UrlScheduleProviderAdminNamespace,
} from "./translations/types";

export const UrlScheduleProviderApp: App<
  UrlScheduleProviderAdminNamespace,
  UrlScheduleProviderAdminKeys
> = {
  name: URL_SCHEDULE_PROVIDER_APP_NAME,
  displayName: "app_url-schedule-provider_admin.app.displayName",
  scope: ["schedule"],
  category: ["apps.categories.schedule"],
  type: "basic",
  target: "company",
  Logo: ({ className }) => <UrlScheduleProviderLogo className={className} />,
  description: {
    text: "app_url-schedule-provider_admin.app.description",
  },
  minimumPlanTier: BillingPlanTier.Solo,
};
