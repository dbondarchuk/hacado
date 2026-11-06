import { App } from "@hacado/types/apps";
import { Mails } from "lucide-react";
import { CUSTOMER_APPOINTMENT_UPDATES_APP_NAME } from "./const";
import {
  CustomerAppointmentUpdatesAdminKeys,
  CustomerAppointmentUpdatesAdminNamespace,
} from "./translations/types";

export const CustomerAppointmentUpdatesApp: App<
  CustomerAppointmentUpdatesAdminNamespace,
  CustomerAppointmentUpdatesAdminKeys
> = {
  name: CUSTOMER_APPOINTMENT_UPDATES_APP_NAME,
  displayName: "app_customer-appointment-updates_admin.app.displayName",
  category: ["apps.categories.notifications"],
  subscribeTo: ["appointment.*"],
  scope: ["event-subscriber", "customer-appointment-text-message"],
  type: "complex",
  target: "company",
  Logo: ({ className }) => <Mails className={className} />,
  isFeatured: true,
  dontAllowMultiple: true,
  description: {
    text: "app_customer-appointment-updates_admin.app.description",
  },
  settingsHref: "communications/customer-appointment-updates",
};
