import { AppMenuItem } from "@hacado/types";
import { Bell } from "lucide-react";
import { CustomerWaitlistNotificationsAppSetup } from "./setup";
import {
  CustomerWaitlistNotificationsAdminKeys,
  CustomerWaitlistNotificationsAdminNamespace,
} from "./translations/types";

export const CustomerWaitlistNotificationsMenuItems: AppMenuItem<
  CustomerWaitlistNotificationsAdminNamespace,
  CustomerWaitlistNotificationsAdminKeys
>[] = [
  {
    href: "communications/customer-waitlist",
    parent: "communications",
    id: "communications-customer-waitlist",
    label: "app_customer-waitlist-notifications_admin.navigation.title",
    icon: <Bell />,
    Page: (props) => (
      <CustomerWaitlistNotificationsAppSetup appId={props.appId} />
    ),
    requiredPermission: { resource: "settings", action: "update" },
  },
];
