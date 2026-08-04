import { AppMenuItem } from "@timelish/types";
import { CalendarDays } from "lucide-react";
import { WeeklyScheduleAppSetup } from "./setup";
import {
  WeeklyScheduleAdminKeys,
  WeeklyScheduleAdminNamespace,
} from "./translations/types";

export const WeeklyScheduleMenuItems: AppMenuItem<
  WeeklyScheduleAdminNamespace,
  WeeklyScheduleAdminKeys
>[] = [
  {
    href: "settings/schedule/weekly",
    parent: "schedule",
    id: "schedule-weekly",
    label: "app_weekly-schedule_admin.navigation.main.title",
    pageTitle: "app_weekly-schedule_admin.navigation.main.title",
    pageDescription: "app_weekly-schedule_admin.navigation.main.description",
    pageBreadcrumbs: [
      {
        title: "app_weekly-schedule_admin.navigation.main.title",
        link: "/dashboard/settings/schedule/weekly",
      },
    ],
    icon: <CalendarDays />,
    Page: (props) => (
      <WeeklyScheduleAppSetup appId={props.appId} services={props.services} />
    ),
    requiredPermission: { resource: "schedule", action: "update" },
  },
];
