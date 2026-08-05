import { zObjectId } from "@hacado/types";
import * as z from "zod";
import { TextMessageAutoReplyAdminAllKeys } from "./translations/types";

export const textMessageAutoReplyConfigurationSchema = z.object({
  autoReplyTemplateId: zObjectId(
    "app_text-message-auto-reply_admin.validation.autoReplyTemplateId.required" satisfies TextMessageAutoReplyAdminAllKeys,
  ),
});

export type TextMessageAutoReplyConfiguration = z.infer<
  typeof textMessageAutoReplyConfigurationSchema
>;
