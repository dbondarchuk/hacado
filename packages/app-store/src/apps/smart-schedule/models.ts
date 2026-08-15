import { asOptionalField } from "@hacado/types";
import * as z from "zod";

export const smartScheduleConfigurationSchema = z.object({
  allowSkipBreak: z.coerce.boolean<boolean>().optional(),
  preferBackToBack: z.coerce.boolean<boolean>().optional(),
  preferLaterStartsEarlierEnds: z.coerce.boolean<boolean>().optional(),
  allowSmartSlotStarts: z.coerce.boolean<boolean>().optional(),
  maximizeForOption: asOptionalField(z.string()),
});

export type SmartScheduleConfiguration = z.infer<
  typeof smartScheduleConfigurationSchema
>;
