import { App, BillingPlanTier } from "@hacado/types";
import { Package } from "lucide-react";
import { CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME } from "./const";
import {
  CustomerPackageEmailNotificationAdminKeys,
  CustomerPackageEmailNotificationAdminNamespace,
} from "./translations/types";

export const CustomerPackageEmailNotificationApp: App<
  CustomerPackageEmailNotificationAdminNamespace,
  CustomerPackageEmailNotificationAdminKeys
> = {
  name: CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME,
  displayName: "app_customer-package-email-notification_admin.app.displayName",
  category: ["apps.categories.notifications"],
  subscribeTo: ["customerPackage.*"],
  scope: [
    "event-subscriber",
    "communication-templates-provider",
    "demo-arguments-provider",
  ],
  type: "complex",
  target: "company",
  Logo: ({ className }) => <Package className={className} />,
  isFeatured: true,
  dontAllowMultiple: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_customer-package-email-notification_admin.app.description",
  },
  settingsHref: "communications/customer-package-email",
};
