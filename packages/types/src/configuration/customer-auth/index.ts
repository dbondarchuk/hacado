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
    emailEnabled: z.boolean(),
    phoneEnabled: z.boolean(),
    otpEmailTemplateId: zObjectId(
      "configuration.customerAuth.otpEmailTemplateId.required",
    ).optional(),
    otpTextTemplateId: zObjectId().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.emailEnabled && !value.phoneEnabled) {
      ctx.addIssue({
        code: "custom",
        path: ["emailEnabled"],
        message: "configuration.customerAuth.channel.required",
      });
    }

    if (value.emailEnabled && !value.otpEmailTemplateId) {
      ctx.addIssue({
        code: "custom",
        path: ["otpEmailTemplateId"],
        message: "configuration.customerAuth.otpEmailTemplateId.required",
      });
    }
  });

export type CustomerAuthConfiguration = z.infer<
  typeof customerAuthConfigurationSchema
>;

export function resolveCustomerOtpChannels(input: {
  emailEnabled: boolean;
  phoneEnabled: boolean;
  smsEnabled: boolean;
}): CustomerOtpChannels {
  const email = input.emailEnabled;
  const phone = input.phoneEnabled && input.smsEnabled;
  if (email && phone) return "email_or_phone";
  if (phone) return "phone";
  if (email) return "email";
  if (input.phoneEnabled) return "email";

  return "email";
}

export function normalizeCustomerAuthConfiguration(
  value: unknown,
): CustomerAuthConfiguration {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const templateId = (key: string) =>
    typeof record[key] === "string" && record[key]
      ? (record[key] as string)
      : undefined;

  if (
    typeof record.emailEnabled === "boolean" ||
    typeof record.phoneEnabled === "boolean"
  ) {
    return {
      emailEnabled: record.emailEnabled === true,
      phoneEnabled: record.phoneEnabled === true,
      otpEmailTemplateId: templateId("otpEmailTemplateId"),
      otpTextTemplateId: templateId("otpTextTemplateId"),
    };
  }

  const channels = record.otpChannels;
  return {
    emailEnabled: channels !== "phone",
    phoneEnabled: channels === "phone" || channels === "email_or_phone",
    otpEmailTemplateId: templateId("otpEmailTemplateId"),
    otpTextTemplateId: templateId("otpTextTemplateId"),
  };
}
