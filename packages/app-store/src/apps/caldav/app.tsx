import { App } from "@hacado/types";
import { CALDAV_APP_NAME } from "./const";
import { CaldavLogo } from "./logo";
import { CaldavAdminKeys, CaldavAdminNamespace } from "./translations/types";

export const CaldavApp: App<CaldavAdminNamespace, CaldavAdminKeys> = {
  name: CALDAV_APP_NAME,
  displayName: "app_caldav_admin.app.displayName",
  category: ["apps.categories.schedule"],
  scope: ["calendar-read", "calendar-write"],
  type: "basic",
  target: "member",
  Logo: ({ className }) => <CaldavLogo className={className} />,
  isFeatured: true,
  description: {
    text: "app_caldav_admin.app.description",
  },
};
