import { AppMenuItem } from "@hacado/types";
import { Package } from "lucide-react";
import { CustomerPackageEmailNotificationAppSetup } from "./setup";
import {
  CustomerPackageEmailNotificationAdminKeys,
  CustomerPackageEmailNotificationAdminNamespace,
} from "./translations/types";

export const CustomerPackageEmailNotificationMenuItems: AppMenuItem<
  CustomerPackageEmailNotificationAdminNamespace,
  CustomerPackageEmailNotificationAdminKeys
>[] = [
  {
    href: "communications/customer-package-email",
    parent: "communications",
    id: "communications-customer-package-email",
    label: "app_customer-package-email-notification_admin.navigation.title",
    icon: <Package />,
    Page: (props) => (
      <CustomerPackageEmailNotificationAppSetup appId={props.appId} />
    ),
    requiredPermission: { resource: "settings", action: "update" },
  },
];
