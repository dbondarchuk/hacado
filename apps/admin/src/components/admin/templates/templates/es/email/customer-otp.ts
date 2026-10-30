import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const customerOtpEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-otp-email",
    name: "Correo electrónico OTP del cliente",
    subject: "Tu código de verificación",
    content: [
      {
        type: "title",
        text: "Tu código de verificación",
      },
      {
        type: "text",
        text: `Hola, {{customer.name}}

Utilice el siguiente código para iniciar sesión en {{config.name}}.`,
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
        text: `Este código es válido por 5 minutos.

Si no solicitó este código, ignore este correo electrónico.`,
      },
      {
        type: "text",
        text: `Saludos cordiales,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
