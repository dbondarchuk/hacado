import { zObjectId } from "@hacado/types";
import * as z from "zod";
import { CustomerEmailNotificationAdminAllKeys } from "./translations/types";

export const eventConfigurationSchema = z.object({
  templateId: zObjectId(
    "app_customer-email-notification_admin.validation.eventTemplate.templateId.required" satisfies CustomerEmailNotificationAdminAllKeys,
  ),
});

export type EventConfiguration = z.infer<typeof eventConfigurationSchema>;

const emailTemplateSchema = z.object({
  templateId: zObjectId(
    "app_customer-email-notification_admin.validation.emailTemplate.templateId.required" satisfies CustomerEmailNotificationAdminAllKeys,
  ),
});

const optionalEmailTemplateSchema = z.object({
  templateId: zObjectId(
    "app_customer-email-notification_admin.validation.emailTemplate.templateId.required" satisfies CustomerEmailNotificationAdminAllKeys,
  ).optional(),
});

export type EmailTemplateConfiguration = z.infer<typeof emailTemplateSchema>;

export const emailTemplateKeys = z.enum([
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "noShow",
  "rescheduled",
]);

export type EmailTemplateKeys = z.infer<typeof emailTemplateKeys>;

export const emailTemplatesSchema = z.object({
  pending: emailTemplateSchema,
  confirmed: emailTemplateSchema,
  declined: emailTemplateSchema,
  canceled: emailTemplateSchema,
  noShow: optionalEmailTemplateSchema.optional(),
  rescheduled: emailTemplateSchema,
});

export type EmailTemplates = z.infer<typeof emailTemplatesSchema>;

export const customerEmailNotificationConfigurationSchema = z.object({
  templates: emailTemplatesSchema,
  event: eventConfigurationSchema,
});

export type CustomerEmailNotificationConfiguration = z.infer<
  typeof customerEmailNotificationConfigurationSchema
>;
