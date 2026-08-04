import { AppMenuItem } from "@timelish/types";
import { Send } from "lucide-react";
import { CustomerTextMessageNotificationAppSetup } from "./setup";
import {
  CustomerTextMessageNotificationAdminKeys,
  CustomerTextMessageNotificationAdminNamespace,
} from "./translations/types";

export const CustomerTextMessageNotificationMenuItems: AppMenuItem<
  CustomerTextMessageNotificationAdminNamespace,
  CustomerTextMessageNotificationAdminKeys
>[] = [
  {
    href: "communications/customer-text-message",
    parent: "communications",
    id: "communications-customer-text-message",
    label: "app_customer-text-message-notification_admin.navigation.title",
    icon: <Send />,
    Page: (props) => (
      <CustomerTextMessageNotificationAppSetup appId={props.appId} />
    ),
    requiredPermission: { resource: "settings", action: "update" },
  },
];
