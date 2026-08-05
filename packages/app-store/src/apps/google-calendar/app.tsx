import { App } from "@hacado/types";
import { GOOGLE_CALENDAR_APP_NAME } from "./const";
import { GoogleCalendarLogo } from "./logo";
import {
  GoogleCalendarAdminKeys,
  GoogleCalendarAdminNamespace,
} from "./translations/types";

export const GoogleCalendarApp: App<
  GoogleCalendarAdminNamespace,
  GoogleCalendarAdminKeys
> = {
  name: GOOGLE_CALENDAR_APP_NAME,
  displayName: "app_google-calendar_admin.app.displayName",
  scope: ["calendar-read", "calendar-write", "meeting-url-provider"],
  type: "oauth",
  target: "member",
  category: ["apps.categories.calendar", "apps.categories.communications"],
  Logo: ({ className }) => <GoogleCalendarLogo className={className} />,
  isFeatured: true,
  description: {
    text: "app_google-calendar_admin.app.description",
  },
};
