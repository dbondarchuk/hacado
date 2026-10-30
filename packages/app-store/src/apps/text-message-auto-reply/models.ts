import { zObjectId } from "@hacado/types/utils";
import * as z from "zod";
import { TextMessageAutoReplyAdminAllKeys } from "./translations/types";

export const textMessageAutoReplyConfigurationSchema = z.object({
  autoReplyTemplateId: zObjectId().optional(),
  enabled: z.boolean().optional(),
  replyText: z
    .string()
    .max(
      300,
      "app_text-message-auto-reply_admin.validation.replyText.max" satisfies TextMessageAutoReplyAdminAllKeys,
    )
    .optional(),
});

export type TextMessageAutoReplyConfiguration = z.infer<
  typeof textMessageAutoReplyConfigurationSchema
>;
