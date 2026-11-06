import { App } from "@hacado/types/apps";
import { Bell } from "lucide-react";
import { MY_APPOINTMENT_NOTIFICATIONS_APP_NAME } from "./const";
import {
  MyAppointmentNotificationsAdminKeys,
  MyAppointmentNotificationsAdminNamespace,
} from "./translations/types";

export const MyAppointmentNotificationsApp: App<
  MyAppointmentNotificationsAdminNamespace,
  MyAppointmentNotificationsAdminKeys
> = {
  name: MY_APPOINTMENT_NOTIFICATIONS_APP_NAME,
  displayName: "app_my-appointment-notifications_admin.app.displayName",
  category: ["apps.categories.notifications"],
  subscribeTo: ["appointment.*"],
  scope: ["event-subscriber"],
  type: "complex",
  target: "member",
  Logo: ({ className }) => <Bell className={className} />,
  isFeatured: false,
  isHidden: false,
  dontAllowMultiple: true,
  description: {
    text: "app_my-appointment-notifications_admin.app.description",
  },
  settingsHref: "communications/my-appointment-notifications",
};
