import { App } from "@hacado/types";
import { CalendarDays } from "lucide-react";
import { WEEKLY_SCHEDULE_APP_NAME } from "./const";
import {
  WeeklyScheduleAdminKeys,
  WeeklyScheduleAdminNamespace,
} from "./translations/types";

export const WeeklyScheduleApp: App<
  WeeklyScheduleAdminNamespace,
  WeeklyScheduleAdminKeys
> = {
  name: WEEKLY_SCHEDULE_APP_NAME,
  displayName: "app_weekly-schedule_admin.app.displayName",
  scope: ["schedule"],
  type: "complex",
  target: "company",
  category: ["apps.categories.schedule"],
  Logo: ({ className }) => <CalendarDays className={className} />,
  isFeatured: true,
  dontAllowMultiple: true,
  description: {
    text: "app_weekly-schedule_admin.app.description",
  },
  settingsHref: "settings/schedule/weekly",
};
