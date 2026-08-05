import { asOptionalField, zPhone } from "@hacado/types";
import * as z from "zod";

export const textMessageNotificationConfigurationSchema = z.object({
  phone: asOptionalField(zPhone),
  processOtherMembersAppointments: z.boolean().optional(),
});

export type TextMessageNotificationConfiguration = z.infer<
  typeof textMessageNotificationConfigurationSchema
>;
