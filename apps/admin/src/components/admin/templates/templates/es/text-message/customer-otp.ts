import { TemplatesTemplate } from "@hacado/types/templates";

export const customerOtpTextTemplate: TemplatesTemplate = {
  name: "Texto OTP del cliente",
  type: "text-message",
  value:
    "{{config.name}}: tu código de verificación es {{otp}}. Válido por 5 minutos. No comparta este código con nadie.",
};
