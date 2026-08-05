import { TemplatesTemplate } from "@hacado/types";

export const customerOtpTextTemplate: TemplatesTemplate = {
  name: "Customer OTP Text",
  type: "text-message",
  value:
    "{{config.name}}: your verification code is {{otp}}. Valid for 5 minutes. Do not share this code with anyone.",
};
