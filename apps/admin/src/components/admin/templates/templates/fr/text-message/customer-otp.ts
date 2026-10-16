import { TemplatesTemplate } from "@hacado/types";

export const customerOtpTextTemplate: TemplatesTemplate = {
  name: "Texte OTP client",
  type: "text-message",
  value:
    "{{config.name}} : votre code de vérification est {{otp}}. Valable 5 minutes. Ne partagez ce code avec personne.",
};
