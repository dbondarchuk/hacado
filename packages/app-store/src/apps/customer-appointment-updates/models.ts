import { asOptionalField, zObjectId } from "@hacado/types/utils";
import * as z from "zod";
import { CustomerAppointmentUpdatesAdminAllKeys } from "./translations/types";

const emailTemplateRequired =
  "app_customer-appointment-updates_admin.validation.emailTemplate.templateId.required" satisfies CustomerAppointmentUpdatesAdminAllKeys;

const packageTemplateRequired =
  "app_customer-appointment-updates_admin.validation.packageTemplate.templateId.required" satisfies CustomerAppointmentUpdatesAdminAllKeys;

const eventTemplateRequired =
  "app_customer-appointment-updates_admin.validation.eventTemplate.templateId.required" satisfies CustomerAppointmentUpdatesAdminAllKeys;

const channelRequired =
  "app_customer-appointment-updates_admin.validation.channel.required" satisfies CustomerAppointmentUpdatesAdminAllKeys;

export const appointmentUpdateEventKeys = z.enum([
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "noShow",
  "rescheduled",
]);

export type AppointmentUpdateEventKey = z.infer<
  typeof appointmentUpdateEventKeys
>;

export const packageEmailKeys = ["pendingPackage", "confirmedPackage"] as const;

export type PackageEmailKey = (typeof packageEmailKeys)[number];

export const appointmentUpdateEventSchema = z.object({
  enabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  textEnabled: z.boolean().optional(),
  emailTemplateId: asOptionalField(zObjectId(emailTemplateRequired)),
  textTemplateId: asOptionalField(zObjectId()),
});

export type AppointmentUpdateEventConfiguration = z.infer<
  typeof appointmentUpdateEventSchema
>;

export const packageEmailSchema = z.object({
  enabled: z.boolean().optional(),
  templateId: asOptionalField(zObjectId(packageTemplateRequired)),
});

export type PackageEmailConfiguration = z.infer<typeof packageEmailSchema>;

export const calendarEventSchema = z.object({
  enabled: z.boolean().optional(),
  templateId: asOptionalField(zObjectId(eventTemplateRequired)),
});

export type CalendarEventConfiguration = z.infer<typeof calendarEventSchema>;

export const appointmentUpdateEventsSchema = z.object({
  pending: appointmentUpdateEventSchema.optional(),
  confirmed: appointmentUpdateEventSchema.optional(),
  declined: appointmentUpdateEventSchema.optional(),
  canceled: appointmentUpdateEventSchema.optional(),
  noShow: appointmentUpdateEventSchema.optional(),
  rescheduled: appointmentUpdateEventSchema.optional(),
});

export type AppointmentUpdateEvents = z.infer<
  typeof appointmentUpdateEventsSchema
>;

export const packageEmailsSchema = z.object({
  pendingPackage: packageEmailSchema.optional(),
  confirmedPackage: packageEmailSchema.optional(),
});

export type PackageEmails = z.infer<typeof packageEmailsSchema>;

export function isCustomerEmailEnabled(
  enabled: boolean | undefined,
  templateId?: string,
) {
  if (enabled === false) return false;

  return Boolean(templateId);
}

export const customerAppointmentUpdatesConfigurationSchema = z
  .object({
    events: appointmentUpdateEventsSchema.optional(),
    packageEmails: packageEmailsSchema.optional(),
    event: calendarEventSchema.optional(),
  })
  .superRefine((data, ctx) => {
    for (const key of appointmentUpdateEventKeys.options) {
      const event = data.events?.[key];
      if (event?.enabled !== true) continue;

      if (event.emailEnabled !== true && event.textEnabled !== true) {
        ctx.addIssue({
          code: "custom",
          path: ["events", key, "enabled"],
          message: channelRequired,
        });
      }

      if (event.emailEnabled === true && !event.emailTemplateId) {
        ctx.addIssue({
          code: "custom",
          path: ["events", key, "emailTemplateId"],
          message: emailTemplateRequired,
        });
      }
    }

    for (const key of packageEmailKeys) {
      const channel = data.packageEmails?.[key];

      if (channel?.enabled === true && !channel.templateId) {
        ctx.addIssue({
          code: "custom",
          path: ["packageEmails", key, "templateId"],
          message: packageTemplateRequired,
        });
      }
    }

    if (data.event?.enabled === true && !data.event.templateId) {
      ctx.addIssue({
        code: "custom",
        path: ["event", "templateId"],
        message: eventTemplateRequired,
      });
    }
  });

export type CustomerAppointmentUpdatesConfiguration = z.infer<
  typeof customerAppointmentUpdatesConfigurationSchema
>;
