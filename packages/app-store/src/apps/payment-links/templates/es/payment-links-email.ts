import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const paymentLinksEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "payment-links-email",
    name: "Enlace de pago",
    subject: "Solicitud de pago de {{config.name}}",
    content: [
      {
        type: "title",
        text: "Tienes una solicitud de pago",
      },
      {
        type: "text",
        text: `Hola {{customer.name}},

{{config.name}} le ha enviado una solicitud de pago por {{payment.amountFormatted}}.

Utilice el botón a continuación para pagar de forma segura.`,
      },
      {
        type: "button",
        button: {
          text: "Paga ahora",
          url: "{{paymentLinkUrl}}",
        },
      },
      {
        type: "text",
        text: `Si el botón no funciona, copia y pega este enlace en tu navegador:
{{paymentLinkUrl}}

Saludos cordiales,

{{config.name}}`,
      },
    ],
  });
