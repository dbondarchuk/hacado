import { asOptionalField, zEmail, zUniqueArray } from "@hacado/types";
import * as z from "zod";

export const emailNotificationConfigurationSchema = z.object({
  email: asOptionalField(zEmail).or(
    zUniqueArray(
      z.array(zEmail),
      (email) => email,
      "validation.common.email.unique",
    ),
  ),
  processOtherMembersAppointments: z.boolean().optional(),
});

export type EmailNotificationConfiguration = z.infer<
  typeof emailNotificationConfigurationSchema
>;
