import { zObjectId } from "@hacado/types";
import * as z from "zod";
import { CustomerPackageEmailNotificationAdminAllKeys } from "./translations/types";

const emailTemplateSchema = z.object({
  templateId: zObjectId(
    "app_customer-package-email-notification_admin.validation.emailTemplate.templateId.required" satisfies CustomerPackageEmailNotificationAdminAllKeys,
  ),
});

const optionalEmailTemplateId = zObjectId(
  "app_customer-package-email-notification_admin.validation.emailTemplate.templateId.required" satisfies CustomerPackageEmailNotificationAdminAllKeys,
).optional();

export const customerPackageEmailTemplateKeys = z.enum([
  "purchased",
  "exhausted",
  "cancelled",
  "expired",
  "expiringSoon",
]);

export type CustomerPackageEmailTemplateKeys = z.infer<
  typeof customerPackageEmailTemplateKeys
>;

export const customerPackageEmailNotificationConfigurationSchema = z
  .object({
    templates: z.object({
      purchased: emailTemplateSchema,
      exhausted: emailTemplateSchema,
      cancelled: emailTemplateSchema,
      expired: emailTemplateSchema,
    }),
    expiringSoon: z.object({
      enabled: z.boolean(),
      thresholdMinutes: z.coerce
        .number<number>()
        .int()
        .min(
          1,
          "app_customer-package-email-notification_admin.validation.expiringSoon.thresholdMinutes.min" satisfies CustomerPackageEmailNotificationAdminAllKeys,
        )
        .optional(),
      templateId: optionalEmailTemplateId,
    }),
  })
  .superRefine((data, ctx) => {
    if (!data.expiringSoon.enabled) return;
    if (!data.expiringSoon.templateId) {
      ctx.addIssue({
        code: "custom",
        path: ["expiringSoon", "templateId"],
        message:
          "app_customer-package-email-notification_admin.validation.emailTemplate.templateId.required" satisfies CustomerPackageEmailNotificationAdminAllKeys,
      });
    }
    if (!data.expiringSoon.thresholdMinutes) {
      ctx.addIssue({
        code: "custom",
        path: ["expiringSoon", "thresholdMinutes"],
        message:
          "app_customer-package-email-notification_admin.validation.expiringSoon.thresholdMinutes.min" satisfies CustomerPackageEmailNotificationAdminAllKeys,
      });
    }
  });

export type CustomerPackageEmailNotificationConfiguration = z.infer<
  typeof customerPackageEmailNotificationConfigurationSchema
>;

export type CustomerPackageEmailNotificationJobPayload =
  | {
      type: "expire-customer-package";
      customerPackageId: string;
    }
  | {
      type: "expiring-soon-customer-package";
      customerPackageId: string;
    }
  | {
      type: "reschedule-expiring-soon";
    };
