import { App } from "@hacado/types";
import { CalendarX2 } from "lucide-react";
import { BUSY_EVENTS_APP_NAME } from "./const";
import {
  BusyEventsAdminAllKeys,
  BusyEventsAdminKeys,
  BusyEventsAdminNamespace,
} from "./translations/types";

export const BusyEventsApp: App<BusyEventsAdminNamespace, BusyEventsAdminKeys> =
  {
    name: BUSY_EVENTS_APP_NAME,
    displayName:
      "app_busy-events_admin.app.displayName" satisfies BusyEventsAdminAllKeys,
    scope: ["calendar-read"],
    type: "complex",
    target: "company",
    category: ["apps.categories.schedule"],
    Logo: ({ className }) => <CalendarX2 className={className} />,
    isFeatured: true,
    dontAllowMultiple: true,
    description: {
      text: "app_busy-events_admin.app.description" satisfies BusyEventsAdminAllKeys,
    },
    settingsHref: "settings/schedule/busy-events",
  };
