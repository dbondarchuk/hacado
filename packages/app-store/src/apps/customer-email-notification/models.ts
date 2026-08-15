import { appointmentStatuses, zObjectId } from "@hacado/types";
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

export type EmailTemplateConfiguration = z.infer<typeof emailTemplateSchema>;

export const emailTemplateKeys = z.enum([
  ...appointmentStatuses,
  "rescheduled",
]);

export type EmailTemplateKeys = z.infer<typeof emailTemplateKeys>;

export const emailTemplatesSchema = z.record(
  emailTemplateKeys,
  emailTemplateSchema,
);

export type EmailTemplates = z.infer<typeof emailTemplatesSchema>;

export const customerEmailNotificationConfigurationSchema = z.object({
  templates: emailTemplatesSchema,
  event: eventConfigurationSchema,
});

export type CustomerEmailNotificationConfiguration = z.infer<
  typeof customerEmailNotificationConfigurationSchema
>;
