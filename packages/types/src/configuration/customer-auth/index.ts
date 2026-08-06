import * as z from "zod";
import { zObjectId } from "../../utils";

export const customerAuthConfigurationSchema = z
  .object({
    otpEmailTemplateId: zObjectId(
      "configuration.customerAuth.otpEmailTemplateId.required",
    ),
    allowPhoneOtp: z.coerce.boolean<boolean>().optional(),
    otpTextTemplateId: zObjectId().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.allowPhoneOtp && !value.otpTextTemplateId) {
      ctx.addIssue({
        code: "custom",
        path: ["otpTextTemplateId"],
        message: "configuration.customerAuth.otpTextTemplateId.required",
      });
    }
  });

export type CustomerAuthConfiguration = z.infer<
  typeof customerAuthConfigurationSchema
>;
