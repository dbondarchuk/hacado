import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const customerOtpEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-otp-email",
    name: "E-mail OTP du client",
    subject: "Votre code de vérification",
    content: [
      {
        type: "title",
        text: "Votre code de vérification",
      },
      {
        type: "text",
        text: `Bonjour, {{customer.name}}

Utilisez le code ci-dessous pour vous connecter à {{config.name}}.`,
      },
      {
        type: "title",
        text: "{{otp}}",
        backgroundColor: "#f0f0f0",
        textColor: "#000000",
      },
      {
        type: "text",
        align: "center",
        text: `Ce code est valable 5 minutes.

Si vous n'avez pas demandé ce code, veuillez ignorer cet e-mail.`,
      },
      {
        type: "text",
        text: `Cordialement,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
