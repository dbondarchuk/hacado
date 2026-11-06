import { AppMenuItem } from "@hacado/types/apps";
import { Bell } from "lucide-react";
import { MyAppointmentNotificationsAppSetup } from "./setup";
import {
  MyAppointmentNotificationsAdminKeys,
  MyAppointmentNotificationsAdminNamespace,
} from "./translations/types";

export const MyAppointmentNotificationsMenuItems: AppMenuItem<
  MyAppointmentNotificationsAdminNamespace,
  MyAppointmentNotificationsAdminKeys
>[] = [
  {
    href: "communications/my-appointment-notifications",
    parent: "communications",
    id: "communications-my-appointment-notifications",
    label: "app_my-appointment-notifications_admin.navigation.title",
    icon: <Bell />,
    Page: (props) => <MyAppointmentNotificationsAppSetup appId={props.appId} />,
    requiredPermission: { resource: "app", action: "useUser" },
  },
];
