import { App } from "@hacado/types/apps";
import { MessageCircleReply } from "lucide-react";
import { TEXT_MESSAGE_FORWARDING_APP_NAME } from "./const";
import {
  TextMessageForwardingAdminKeys,
  TextMessageForwardingAdminNamespace,
} from "./translations/types";

export const TextMessageForwardingApp: App<
  TextMessageForwardingAdminNamespace,
  TextMessageForwardingAdminKeys
> = {
  name: TEXT_MESSAGE_FORWARDING_APP_NAME,
  displayName: "app_text-message-forwarding_admin.app.displayName",
  scope: ["text-message-respond"],
  category: ["apps.categories.communications"],
  type: "basic",
  target: "company",
  Logo: ({ className }) => <MessageCircleReply className={className} />,
  description: {
    text: "app_text-message-forwarding_admin.app.description",
  },
};
