import { App } from "@hacado/types";
import { BellRing } from "lucide-react";
import { APPOINTMENT_NOTIFICATIONS_APP_NAME } from "./const";
import {
  AppointmentNotificationsAdminKeys,
  AppointmentNotificationsAdminNamespace,
} from "./translations/types";

export const AppointmentNotificationsApp: App<
  AppointmentNotificationsAdminNamespace,
  AppointmentNotificationsAdminKeys
> = {
  name: APPOINTMENT_NOTIFICATIONS_APP_NAME,
  displayName: "app_appointment-notifications_admin.app.displayName",
  subscribeTo: ["appointment.*"],
  scope: ["scheduled", "event-subscriber", "communication-templates-provider"],
  type: "complex",
  target: "company",
  category: ["apps.categories.notifications"],
  Logo: ({ className }) => <BellRing className={className} />,
  dontAllowMultiple: true,
  // isHidden: true,
  description: {
    text: "app_appointment-notifications_admin.app.description",
  },
  settingsHref: "communications/scheduled-notifications",
};
