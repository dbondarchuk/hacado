import * as z from "zod";
import { zObjectId } from "../../utils";

export const customerOtpChannels = [
  "email",
  "phone",
  "email_or_phone",
] as const;

export type CustomerOtpChannels = (typeof customerOtpChannels)[number];

export function customerOtpAllowsEmail(channels: CustomerOtpChannels): boolean {
  return channels === "email" || channels === "email_or_phone";
}

export function customerOtpAllowsPhone(channels: CustomerOtpChannels): boolean {
  return channels === "phone" || channels === "email_or_phone";
}

export const customerAuthConfigurationSchema = z
  .object({
    otpChannels: z.enum(customerOtpChannels, {
      message: "configuration.customerAuth.otpChannels.required",
    }),
    otpEmailTemplateId: zObjectId(
      "configuration.customerAuth.otpEmailTemplateId.required",
    ).optional(),
    otpTextTemplateId: zObjectId().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      customerOtpAllowsEmail(value.otpChannels) &&
      !value.otpEmailTemplateId
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["otpEmailTemplateId"],
        message: "configuration.customerAuth.otpEmailTemplateId.required",
      });
    }

    if (customerOtpAllowsPhone(value.otpChannels) && !value.otpTextTemplateId) {
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
