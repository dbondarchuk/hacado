import { App } from "@hacado/types";
import { SendHorizonal } from "lucide-react";
import { TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "./const";
import {
  TextMessageNotificationAdminKeys,
  TextMessageNotificationAdminNamespace,
} from "./translations/types";

export const TextMessageNotificationApp: App<
  TextMessageNotificationAdminNamespace,
  TextMessageNotificationAdminKeys
> = {
  name: TEXT_MESSAGE_NOTIFICATION_APP_NAME,
  displayName: "app_text-message-notification_admin.app.displayName",
  subscribeTo: ["appointment.*"],
  scope: ["event-subscriber"],
  category: ["apps.categories.notifications"],
  type: "basic",
  Logo: ({ className }) => <SendHorizonal className={className} />,
  isFeatured: true,
  dontAllowMultiple: true,
  target: "member",
  requiredPermission: { resource: "app", action: "installPrivileged" },
  description: {
    text: "app_text-message-notification_admin.app.description",
  },
};
