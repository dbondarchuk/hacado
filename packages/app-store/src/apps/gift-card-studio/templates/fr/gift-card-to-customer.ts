import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const giftCardToCustomerEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "gift-card-studio-customer-email",
    name: "Achat d'une carte cadeau (à l'acheteur)",
    subject: "Votre achat de carte cadeau",
    content: [
      {
        type: "title",
        text: "Merci pour votre achat de carte cadeau !",
      },
      {
        type: "text",
        text: `Bonjour {{customer.name}},

Merci d'avoir acheté une carte-cadeau de {{config.name}}.

Montant : {{giftCard.amountPurchasedFormatted}}

Code de la carte cadeau : {{giftCard.giftCardCode}}

Votre carte cadeau et votre facture sont jointes à cet e-mail sous forme de fichiers PDF.

Cordialement,

{{config.name}}`,
      },
    ],
  });
