import { App } from "@timelish/types";
import { MessageSquareReply } from "lucide-react";
import { TEXT_MESSAGE_AUTO_REPLY_APP_NAME } from "./const";
import {
  TextMessageAutoReplyAdminKeys,
  TextMessageAutoReplyAdminNamespace,
} from "./translations/types";

export const TextMessageAutoReplyApp: App<
  TextMessageAutoReplyAdminNamespace,
  TextMessageAutoReplyAdminKeys
> = {
  name: TEXT_MESSAGE_AUTO_REPLY_APP_NAME,
  displayName: "app_text-message-auto-reply_admin.app.displayName",
  scope: ["text-message-respond"],
  category: ["apps.categories.communications"],
  type: "basic",
  target: "company",
  Logo: ({ className }) => <MessageSquareReply className={className} />,
  description: {
    text: "app_text-message-auto-reply_admin.app.description",
  },
};
