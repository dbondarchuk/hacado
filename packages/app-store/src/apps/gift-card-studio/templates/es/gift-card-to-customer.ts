import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const giftCardToCustomerEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "gift-card-studio-customer-email",
    name: "Compra de tarjeta de regalo (al comprador)",
    subject: "Tu compra con tarjeta regalo",
    content: [
      {
        type: "title",
        text: "¡Gracias por la compra de tu tarjeta de regalo!",
      },
      {
        type: "text",
        text: `Hola {{customer.name}},

Gracias por comprar una tarjeta de regalo de {{config.name}}.

Cantidad: {{giftCard.amountPurchasedFormatted}}

Código de tarjeta de regalo: {{giftCard.giftCardCode}}

Su tarjeta de regalo y su factura se adjuntan a este correo electrónico como archivos PDF.

Saludos cordiales,

{{config.name}}`,
      },
    ],
  });
