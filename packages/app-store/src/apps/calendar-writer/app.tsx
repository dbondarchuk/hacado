import { App } from "@hacado/types";
import { CalendarPlus } from "lucide-react";
import { CALENDAR_WRITER_APP_NAME } from "./const";
import {
  CalendarWriterAdminKeys,
  CalendarWriterAdminNamespace,
} from "./translations/types";

export const CalendarWriterApp: App<
  CalendarWriterAdminNamespace,
  CalendarWriterAdminKeys
> = {
  name: CALENDAR_WRITER_APP_NAME,
  displayName: "app_calendar-writer_admin.app.displayName",
  category: ["apps.categories.notifications"],
  subscribeTo: ["appointment.*", "app.uninstalled"],
  scope: ["event-subscriber"],
  type: "basic",
  target: "member",
  Logo: ({ className }) => <CalendarPlus className={className} />,
  isFeatured: false,
  isHidden: false,
  dontAllowMultiple: false,
  description: {
    text: "app_calendar-writer_admin.app.description",
  },
};
