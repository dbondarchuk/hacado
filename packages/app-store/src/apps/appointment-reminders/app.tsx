import { App } from "@hacado/types/apps";
import { BellRing } from "lucide-react";
import { APPOINTMENT_REMINDERS_APP_NAME } from "./const";
import {
  AppointmentRemindersAdminKeys,
  AppointmentRemindersAdminNamespace,
} from "./translations/types";

export const AppointmentRemindersApp: App<
  AppointmentRemindersAdminNamespace,
  AppointmentRemindersAdminKeys
> = {
  name: APPOINTMENT_REMINDERS_APP_NAME,
  displayName: "app_appointment-reminders_admin.app.displayName",
  subscribeTo: ["appointment.*"],
  scope: [
    "scheduled",
    "event-subscriber",
    "communication-templates-provider",
    "customer-appointment-text-message",
  ],
  type: "complex",
  target: "company",
  category: ["apps.categories.notifications"],
  Logo: ({ className }) => <BellRing className={className} />,
  dontAllowMultiple: true,
  description: {
    text: "app_appointment-reminders_admin.app.description",
  },
  settingsHref: "communications/appointment-reminders",
};
