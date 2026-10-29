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

export const smartScheduleSetupSchema = smartScheduleConfigurationSchema
  .extend({
    maximizeForService: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.maximizeForService && !data.maximizeForOption) {
      ctx.addIssue({
        code: "custom",
        path: ["maximizeForOption"],
        message: "app_smart-schedule_admin.form.preferredServiceRequired",
      });
    }
  });

export type SmartScheduleSetupConfiguration = z.infer<
  typeof smartScheduleSetupSchema
>;
