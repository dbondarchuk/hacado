import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const giftCardToRecipientEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "gift-card-studio-recipient-email",
    name: "Tarjeta de regalo (al destinatario)",
    subject: "Has recibido una tarjeta regalo",
    content: [
      {
        type: "title",
        text: "¡Has recibido una tarjeta regalo!",
      },
      {
        type: "text",
        text: `Hola {{giftCard.toName}},

{{customer.name}} ha comprado una tarjeta de regalo para usted en {{config.name}}.

Cantidad: {{giftCard.amountPurchasedFormatted}}

Código de tarjeta de regalo: {{giftCard.giftCardCode}}

Mensaje del remitente: {{giftCard.message}}

Su tarjeta de regalo se adjunta a este correo electrónico como un archivo PDF.

¡Esperamos verte pronto!

{{config.name}}`,
      },
    ],
  });
