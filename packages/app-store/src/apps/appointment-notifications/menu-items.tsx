import { AppMenuItem } from "@timelish/types";
import { BellRing } from "lucide-react";
import { EditAppointmentNotificationPage } from "./edit-page";
import { NewAppointmentNotificationPage } from "./new-page";
import { AppointmentNotificationsPage } from "./page";
import {
  AppointmentNotificationsAdminAllKeys,
  AppointmentNotificationsAdminKeys,
  AppointmentNotificationsAdminNamespace,
} from "./translations/types";

const appointmentNotificationBreadcrumb = {
  title:
    "app_appointment-notifications_admin.navigation.main.title" as AppointmentNotificationsAdminAllKeys,
  link: "/dashboard/communications/appointment-notifications",
};

export const AppointmentNotificationsMenuItems: AppMenuItem<
  AppointmentNotificationsAdminNamespace,
  AppointmentNotificationsAdminKeys
>[] = [
  {
    href: "communications/appointment-notifications",
    parent: "communications",
    id: "communications-appointment-notifications",
    order: 100,
    notScrollable: true,
    label: "app_appointment-notifications_admin.navigation.main.title",
    icon: <BellRing />,
    Page: (props) => <AppointmentNotificationsPage appId={props.appId} />,
    pageBreadcrumbs: [appointmentNotificationBreadcrumb],
    pageTitle: "app_appointment-notifications_admin.navigation.main.title",
    pageDescription:
      "app_appointment-notifications_admin.navigation.main.description",
    requiredPermission: { resource: "settings", action: "update" },
  },
  {
    href: "communications/appointment-notifications/new",
    parent: "communications",
    id: "communications-appointment-notifications-new",
    isHidden: true,
    label: "app_appointment-notifications_admin.navigation.main.title",
    icon: <BellRing />,
    Page: (props) => <NewAppointmentNotificationPage appId={props.appId} />,
    pageBreadcrumbs: [
      appointmentNotificationBreadcrumb,
      {
        title: "app_appointment-notifications_admin.navigation.new.title",
        link: "/dashboard/communications/appointment-notifications/new",
      },
    ],
    pageTitle: "app_appointment-notifications_admin.navigation.new.title",
    pageDescription:
      "app_appointment-notifications_admin.navigation.new.description",
    requiredPermission: { resource: "settings", action: "update" },
  },
  {
    href: "communications/appointment-notifications/edit",
    parent: "communications",
    id: "communications-appointment-notifications-new",
    isHidden: true,
    label: "app_appointment-notifications_admin.navigation.main.title",
    icon: <BellRing />,
    Page: (props) => <EditAppointmentNotificationPage appId={props.appId} />,
    pageBreadcrumbs: [
      appointmentNotificationBreadcrumb,
      {
        title: "app_appointment-notifications_admin.navigation.edit.title",
        link: "/dashboard/communications/appointment-notifications/edit",
      },
    ],
    pageTitle: "app_appointment-notifications_admin.navigation.edit.title",
    pageDescription:
      "app_appointment-notifications_admin.navigation.edit.description",
    requiredPermission: { resource: "settings", action: "update" },
  },
];
