import { App } from "@timelish/types";
import { Mails } from "lucide-react";
import { CUSTOMER_EMAIL_NOTIFICATION_APP_NAME } from "./const";
import {
  CustomerEmailNotificationAdminKeys,
  CustomerEmailNotificationAdminNamespace,
} from "./translations/types";

export const CustomerEmailNotificationApp: App<
  CustomerEmailNotificationAdminNamespace,
  CustomerEmailNotificationAdminKeys
> = {
  name: CUSTOMER_EMAIL_NOTIFICATION_APP_NAME,
  displayName: "app_customer-email-notification_admin.app.displayName",
  category: ["apps.categories.notifications"],
  subscribeTo: ["appointment.*"],
  scope: ["event-subscriber"],
  type: "complex",
  target: "company",
  Logo: ({ className }) => <Mails className={className} />,
  isFeatured: true,
  dontAllowMultiple: true,
  description: {
    text: "app_customer-email-notification_admin.app.description",
  },
  settingsHref: "communications/customer-email",
};
