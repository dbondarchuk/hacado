import { App } from "@timelish/types";
import { OUTLOOK_APP_NAME } from "./const";
import { OutlookLogo } from "./logo";
import { OutlookAdminKeys, OutlookAdminNamespace } from "./translations/types";

export const OutlookApp: App<OutlookAdminNamespace, OutlookAdminKeys> = {
  name: OUTLOOK_APP_NAME,
  displayName: "app_outlook_admin.app.displayName",
  scope: [
    "calendar-read",
    "calendar-write",
    "mail-send",
    "meeting-url-provider",
  ],
  type: "oauth",
  target: "member",
  category: ["apps.categories.calendar", "apps.categories.communications"],
  Logo: ({ className }) => <OutlookLogo className={className} />,
  isFeatured: true,
  description: {
    text: "app_outlook_admin.app.description",
  },
};
