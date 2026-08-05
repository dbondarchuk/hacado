import { App } from "@hacado/types";
import { SMART_SCHEDULE_APP_NAME } from "./const";
import { SmartScheduleLogo } from "./logo";
import {
  SmartScheduleAdminKeys,
  SmartScheduleAdminNamespace,
} from "./translations/types";

export const SmartScheduleApp: App<
  SmartScheduleAdminNamespace,
  SmartScheduleAdminKeys
> = {
  name: SMART_SCHEDULE_APP_NAME,
  displayName: "app_smart-schedule_admin.app.displayName",
  scope: ["availability-provider"],
  category: ["apps.categories.schedule"],
  type: "basic",
  target: "company",
  Logo: ({ className }) => <SmartScheduleLogo className={className} />,
  description: {
    text: "app_smart-schedule_admin.app.description",
  },
};
