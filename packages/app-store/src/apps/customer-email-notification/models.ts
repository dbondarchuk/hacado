import { asOptionalField, zObjectId } from "@hacado/types";
import * as z from "zod";
import { CustomerEmailNotificationAdminAllKeys } from "./translations/types";

const emailTemplateRequired =
  "app_customer-email-notification_admin.validation.emailTemplate.templateId.required" satisfies CustomerEmailNotificationAdminAllKeys;

const eventTemplateRequired =
  "app_customer-email-notification_admin.validation.eventTemplate.templateId.required" satisfies CustomerEmailNotificationAdminAllKeys;

const emailChannelSchema = z.object({
  enabled: z.boolean().optional(),
  templateId: asOptionalField(zObjectId(emailTemplateRequired)),
});

export const eventConfigurationSchema = z.object({
  enabled: z.boolean().optional(),
  templateId: asOptionalField(zObjectId(eventTemplateRequired)),
});

export type EventConfiguration = z.infer<typeof eventConfigurationSchema>;

export type EmailTemplateConfiguration = z.infer<typeof emailChannelSchema>;

export const emailTemplateKeys = z.enum([
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "noShow",
  "rescheduled",
]);

export type EmailTemplateKeys = z.infer<typeof emailTemplateKeys>;

export const customerEmailNotificationChannelKeys = [
  "pending",
  "confirmed",
  "pendingPackage",
  "confirmedPackage",
  "declined",
  "canceled",
  "noShow",
  "rescheduled",
] as const;

export type CustomerEmailNotificationChannelKey =
  (typeof customerEmailNotificationChannelKeys)[number];

export function isCustomerEmailEnabled(
  enabled: boolean | undefined,
  templateId?: string,
) {
  if (enabled === false) return false;

  return Boolean(templateId);
}

export const emailTemplatesSchema = z.object({
  pending: emailChannelSchema,
  confirmed: emailChannelSchema,
  declined: emailChannelSchema,
  canceled: emailChannelSchema,
  rescheduled: emailChannelSchema,
  noShow: emailChannelSchema.optional(),
  pendingPackage: emailChannelSchema.optional(),
  confirmedPackage: emailChannelSchema.optional(),
});

export type EmailTemplates = z.infer<typeof emailTemplatesSchema>;

export const customerEmailNotificationConfigurationSchema = z
  .object({
    templates: emailTemplatesSchema,
    event: eventConfigurationSchema,
  })
  .superRefine((data, ctx) => {
    for (const key of customerEmailNotificationChannelKeys) {
      const channel = data.templates[key];
      if (channel?.enabled === true && !channel.templateId) {
        ctx.addIssue({
          code: "custom",
          path: ["templates", key, "templateId"],
          message: emailTemplateRequired,
        });
      }
    }

    if (data.event.enabled === true && !data.event.templateId) {
      ctx.addIssue({
        code: "custom",
        path: ["event", "templateId"],
        message: eventTemplateRequired,
      });
    }
  });

export type CustomerEmailNotificationConfiguration = z.infer<
  typeof customerEmailNotificationConfigurationSchema
>;
