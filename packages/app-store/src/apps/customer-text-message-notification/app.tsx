import { App } from "@timelish/types";
import { Send } from "lucide-react";
import { CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "./const";
import {
  CustomerTextMessageNotificationAdminKeys,
  CustomerTextMessageNotificationAdminNamespace,
} from "./translations/types";

export const CustomerTextMessageNotificationApp: App<
  CustomerTextMessageNotificationAdminNamespace,
  CustomerTextMessageNotificationAdminKeys
> = {
  name: CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME,
  displayName: "app_customer-text-message-notification_admin.app.displayName",
  subscribeTo: ["appointment.*"],
  scope: ["event-subscriber"],
  type: "complex",
  target: "company",
  category: ["apps.categories.notifications"],
  Logo: ({ className }) => <Send className={className} />,
  isFeatured: true,
  dontAllowMultiple: true,
  description: {
    text: "app_customer-text-message-notification_admin.app.description",
  },
  settingsHref: "communications/customer-text-message",
};
