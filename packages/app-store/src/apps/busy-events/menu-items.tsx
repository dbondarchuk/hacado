import { AppMenuItem } from "@hacado/types";
import { CalendarX2 } from "lucide-react";
import { BusyEventsAppSetup } from "./setup";
import {
  BusyEventsAdminAllKeys,
  BusyEventsAdminKeys,
  BusyEventsAdminNamespace,
} from "./translations/types";

export const BusyEventsMenuItems: AppMenuItem<
  BusyEventsAdminNamespace,
  BusyEventsAdminKeys
>[] = [
  {
    href: "settings/schedule/busy-events",
    parent: "schedule",
    id: "schedule-busy-events",
    label:
      "app_busy-events_admin.navigation.busyEvents.label" satisfies BusyEventsAdminAllKeys,
    pageTitle:
      "app_busy-events_admin.navigation.busyEvents.title" satisfies BusyEventsAdminAllKeys,
    pageDescription:
      "app_busy-events_admin.navigation.busyEvents.description" satisfies BusyEventsAdminAllKeys,
    pageBreadcrumbs: [
      {
        title:
          "app_busy-events_admin.navigation.busyEvents.label" satisfies BusyEventsAdminAllKeys,
        link: "/dashboard/settings/schedule/busy-events",
      },
    ],
    icon: <CalendarX2 />,
    Page: (props) => (
      <BusyEventsAppSetup appId={props.appId} services={props.services} />
    ),
    requiredPermission: { resource: "schedule", action: "read" },
  },
];
