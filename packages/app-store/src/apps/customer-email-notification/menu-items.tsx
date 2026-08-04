import { AppMenuItem } from "@timelish/types";
import { Mails } from "lucide-react";
import { CustomerEmailNotificationAppSetup } from "./setup";
import {
  CustomerEmailNotificationAdminKeys,
  CustomerEmailNotificationAdminNamespace,
} from "./translations/types";

export const CustomerEmailNotificationMenuItems: AppMenuItem<
  CustomerEmailNotificationAdminNamespace,
  CustomerEmailNotificationAdminKeys
>[] = [
  {
    href: "communications/customer-email",
    parent: "communications",
    id: "communications-customer-email",
    label: "app_customer-email-notification_admin.navigation.title",
    icon: <Mails />,
    Page: (props) => <CustomerEmailNotificationAppSetup appId={props.appId} />,
    requiredPermission: { resource: "settings", action: "update" },
  },
];
