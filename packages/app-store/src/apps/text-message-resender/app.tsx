import { App } from "@hacado/types";
import { MessageCircleReply } from "lucide-react";
import { TEXT_MESSAGE_RESENDER_APP_NAME } from "./const";
import {
  TextMessageResenderAdminKeys,
  TextMessageResenderAdminNamespace,
} from "./translations/types";

export const TextMessageResenderApp: App<
  TextMessageResenderAdminNamespace,
  TextMessageResenderAdminKeys
> = {
  name: TEXT_MESSAGE_RESENDER_APP_NAME,
  displayName: "app_text-message-resender_admin.app.displayName",
  scope: ["text-message-respond"],
  category: ["apps.categories.communications"],
  type: "basic",
  target: "company",
  Logo: ({ className }) => <MessageCircleReply className={className} />,
  description: {
    text: "app_text-message-resender_admin.app.description",
  },
};
