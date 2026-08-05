import { App } from "@hacado/types";
import { Mailbox } from "lucide-react";
import { EMAIL_NOTIFICATION_APP_NAME } from "./const";
import {
  EmailNotificationAdminKeys,
  EmailNotificationAdminNamespace,
} from "./translations/types";

export const EmailNotificationApp: App<
  EmailNotificationAdminNamespace,
  EmailNotificationAdminKeys
> = {
  name: EMAIL_NOTIFICATION_APP_NAME,
  displayName: "app_email-notification_admin.app.displayName",
  category: ["apps.categories.notifications"],
  subscribeTo: ["appointment.*"],
  scope: ["event-subscriber"],
  type: "basic",
  target: "member",
  Logo: ({ className }) => <Mailbox className={className} />,
  isFeatured: false,
  isHidden: false,
  dontAllowMultiple: true,
  description: {
    text: "app_email-notification_admin.app.description",
  },
};
