import { zObjectId } from "@hacado/types";
import * as z from "zod";

export const textMessagesTemplateSchema = z.object({
  templateId: zObjectId().optional(),
});

export type TextMessageTemplateConfiguration = z.infer<
  typeof textMessagesTemplateSchema
>;

export const textMessagesTemplateKeys = z.enum([
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "noShow",
  "rescheduled",
]);

export type TextMessagesTemplateKeys = z.infer<typeof textMessagesTemplateKeys>;

export const textMessagesTemplatesSchema = z
  .object({
    pending: textMessagesTemplateSchema,
    confirmed: textMessagesTemplateSchema,
    declined: textMessagesTemplateSchema,
    canceled: textMessagesTemplateSchema,
    noShow: textMessagesTemplateSchema,
    rescheduled: textMessagesTemplateSchema,
  })
  .partial();

export const customerTextMessageNotificationConfigurationSchema = z.object({
  templates: textMessagesTemplatesSchema,
});

export type CustomerTextMessageNotificationConfiguration = z.infer<
  typeof customerTextMessageNotificationConfigurationSchema
>;
