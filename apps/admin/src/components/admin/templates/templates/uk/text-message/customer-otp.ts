import { TemplatesTemplate } from "@hacado/types";

export const customerOtpTextTemplate: TemplatesTemplate = {
  name: "OTP SMS для клієнта",
  type: "text-message",
  value:
    "{{config.name}}: ваш код підтвердження - {{otp}}. Дійсний 5 хвилин. Не передавайте код нікому.",
};
