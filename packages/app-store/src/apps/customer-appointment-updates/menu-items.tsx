import { AppMenuItem } from "@hacado/types/apps";
import { Mails } from "lucide-react";
import { CustomerAppointmentUpdatesAppSetup } from "./setup";
import {
  CustomerAppointmentUpdatesAdminKeys,
  CustomerAppointmentUpdatesAdminNamespace,
} from "./translations/types";

export const CustomerAppointmentUpdatesMenuItems: AppMenuItem<
  CustomerAppointmentUpdatesAdminNamespace,
  CustomerAppointmentUpdatesAdminKeys
>[] = [
  {
    href: "communications/customer-appointment-updates",
    parent: "communications",
    id: "communications-customer-appointment-updates",
    label: "app_customer-appointment-updates_admin.navigation.title",
    icon: <Mails />,
    Page: (props) => <CustomerAppointmentUpdatesAppSetup appId={props.appId} />,
    requiredPermission: { resource: "settings", action: "update" },
  },
];
