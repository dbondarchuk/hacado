import { AppMenuItem } from "@hacado/types/apps";
import { BellRing } from "lucide-react";
import { EditAppointmentReminderPage } from "./edit-page";
import { NewAppointmentReminderPage } from "./new-page";
import { AppointmentRemindersPage } from "./page";
import {
  AppointmentRemindersAdminAllKeys,
  AppointmentRemindersAdminKeys,
  AppointmentRemindersAdminNamespace,
} from "./translations/types";

const appointmentReminderBreadcrumb = {
  title:
    "app_appointment-reminders_admin.navigation.main.title" as AppointmentRemindersAdminAllKeys,
  link: "/dashboard/communications/appointment-reminders",
};

export const AppointmentRemindersMenuItems: AppMenuItem<
  AppointmentRemindersAdminNamespace,
  AppointmentRemindersAdminKeys
>[] = [
  {
    href: "communications/appointment-reminders",
    parent: "communications",
    id: "communications-appointment-reminders",
    order: 100,
    notScrollable: true,
    hideHeading: true,
    label: "app_appointment-reminders_admin.navigation.main.title",
    icon: <BellRing />,
    Page: (props) => <AppointmentRemindersPage appId={props.appId} />,
    pageBreadcrumbs: [appointmentReminderBreadcrumb],
    pageTitle: "app_appointment-reminders_admin.navigation.main.title",
    pageDescription:
      "app_appointment-reminders_admin.navigation.main.description",
    requiredPermission: { resource: "settings", action: "update" },
  },
  {
    href: "communications/appointment-reminders/new",
    parent: "communications",
    id: "communications-appointment-reminders-new",
    isHidden: true,
    hideHeading: true,
    label: "app_appointment-reminders_admin.navigation.main.title",
    icon: <BellRing />,
    Page: (props) => <NewAppointmentReminderPage appId={props.appId} />,
    pageBreadcrumbs: [
      appointmentReminderBreadcrumb,
      {
        title: "app_appointment-reminders_admin.navigation.new.title",
        link: "/dashboard/communications/appointment-reminders/new",
      },
    ],
    pageTitle: "app_appointment-reminders_admin.navigation.new.title",
    pageDescription:
      "app_appointment-reminders_admin.navigation.new.description",
    requiredPermission: { resource: "settings", action: "update" },
  },
  {
    href: "communications/appointment-reminders/edit",
    parent: "communications",
    id: "communications-appointment-reminders-edit",
    isHidden: true,
    hideHeading: true,
    label: "app_appointment-reminders_admin.navigation.main.title",
    icon: <BellRing />,
    Page: (props) => <EditAppointmentReminderPage appId={props.appId} />,
    pageBreadcrumbs: [
      appointmentReminderBreadcrumb,
      {
        title: "app_appointment-reminders_admin.navigation.edit.title",
        link: "/dashboard/communications/appointment-reminders/edit",
      },
    ],
    pageTitle: "app_appointment-reminders_admin.navigation.edit.title",
    pageDescription:
      "app_appointment-reminders_admin.navigation.edit.description",
    requiredPermission: { resource: "settings", action: "update" },
  },
];
