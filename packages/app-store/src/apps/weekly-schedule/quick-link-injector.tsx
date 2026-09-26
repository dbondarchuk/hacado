import { DashboardQuickLinkInjectorApp } from "@hacado/types";
import { CalendarDays } from "lucide-react";
import {
  WeeklyScheduleAdminKeys,
  WeeklyScheduleAdminNamespace,
} from "./translations/types";

export const WeeklyScheduleQuickLinkInjector: DashboardQuickLinkInjectorApp<
  WeeklyScheduleAdminNamespace,
  WeeklyScheduleAdminKeys
> = {
  items: [
    {
      id: "weekly-schedule-adjust",
      order: 110,
      href: "/dashboard/settings/schedule/weekly",
      label: "app_weekly-schedule_admin.quickLinks.adjust",
      icon: <CalendarDays className="size-4" strokeWidth={1.5} />,
      requiredPermission: { resource: "schedule", action: "update" },
    },
  ],
};
