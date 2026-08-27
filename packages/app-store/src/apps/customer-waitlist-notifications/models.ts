import { asOptionalField, zObjectId } from "@hacado/types";
import * as z from "zod";

export const customerWaitlistNotificationsConfigurationSchema = z.object({
  customerNewEntryTemplateId: asOptionalField(zObjectId()),
});

export type CustomerWaitlistNotificationsConfiguration = z.infer<
  typeof customerWaitlistNotificationsConfigurationSchema
>;
