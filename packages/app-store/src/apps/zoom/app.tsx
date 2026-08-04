import { App, BillingPlanTier } from "@timelish/types";
import { ZOOM_APP_NAME } from "./const";
import { ZoomLogo } from "./logo";
import { ZoomAdminKeys, ZoomAdminNamespace } from "./translations/types";

export const ZoomApp: App<ZoomAdminNamespace, ZoomAdminKeys> = {
  name: ZOOM_APP_NAME,
  displayName: "app_zoom_admin.app.displayName",
  subscribeTo: ["appointment.*"],
  scope: ["meeting-url-provider", "calendar-read", "event-subscriber"],
  type: "oauth",
  target: "member",
  category: ["apps.categories.communications", "apps.categories.calendar"],
  Logo: ({ className }) => <ZoomLogo className={className} />,
  isFeatured: true,
  description: {
    text: "app_zoom_admin.app.description",
  },
  minimumPlanTier: BillingPlanTier.Solo,
};
