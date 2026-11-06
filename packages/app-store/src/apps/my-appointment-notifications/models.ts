import {
  asOptionalField,
  zEmail,
  zPhone,
  zUniqueArray,
} from "@hacado/types/utils";
import * as z from "zod";
import { MyAppointmentNotificationsAdminAllKeys } from "./translations/types";

export const myAppointmentNotificationEventKeys = [
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "noShow",
  "rescheduled",
] as const;

export type MyAppointmentNotificationEventKey =
  (typeof myAppointmentNotificationEventKeys)[number];

const channelRequired =
  "app_my-appointment-notifications_admin.validation.form.channel.required" satisfies MyAppointmentNotificationsAdminAllKeys;

export const myAppointmentNotificationEventSchema = z
  .object({
    enabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    textEnabled: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.enabled !== true) return;

    if (data.emailEnabled !== true && data.textEnabled !== true) {
      ctx.addIssue({
        code: "custom",
        path: ["emailEnabled"],
        message: channelRequired,
      });
    }
  });

export type MyAppointmentNotificationEvent = z.infer<
  typeof myAppointmentNotificationEventSchema
>;

export const myAppointmentNotificationsEventsSchema = z.object({
  pending: myAppointmentNotificationEventSchema,
  confirmed: myAppointmentNotificationEventSchema,
  declined: myAppointmentNotificationEventSchema,
  canceled: myAppointmentNotificationEventSchema,
  noShow: myAppointmentNotificationEventSchema,
  rescheduled: myAppointmentNotificationEventSchema,
});

export const myAppointmentNotificationsConfigurationSchema = z.object({
  email: asOptionalField(zEmail).or(
    zUniqueArray(
      z.array(zEmail),
      (email) => email,
      "validation.common.email.unique",
    ),
  ),
  phone: asOptionalField(zPhone),
  processOtherMembersAppointments: z.boolean().optional(),
  events: myAppointmentNotificationsEventsSchema,
});

export type MyAppointmentNotificationsConfiguration = z.infer<
  typeof myAppointmentNotificationsConfigurationSchema
>;

export const defaultMyAppointmentNotificationEvent =
  (): MyAppointmentNotificationEvent => ({
    enabled: true,
    emailEnabled: true,
    textEnabled: false,
  });

export const defaultMyAppointmentNotificationsEvents = () =>
  Object.fromEntries(
    myAppointmentNotificationEventKeys.map((key) => [
      key,
      defaultMyAppointmentNotificationEvent(),
    ]),
  ) as MyAppointmentNotificationsConfiguration["events"];
