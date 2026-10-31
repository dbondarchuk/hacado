import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const giftCardToRecipientEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "gift-card-studio-recipient-email",
    name: "Carte cadeau (au destinataire)",
    subject: "Vous avez reçu une carte cadeau",
    content: [
      {
        type: "title",
        text: "Vous avez reçu une carte cadeau !",
      },
      {
        type: "text",
        text: `Bonjour {{giftCard.toName}},

{{customer.name}} a acheté une carte-cadeau pour vous chez {{config.name}}.

Montant : {{giftCard.amountPurchasedFormatted}}

Code de la carte cadeau : {{giftCard.giftCardCode}}

Message de l'expéditeur : {{giftCard.message}}

Votre carte cadeau est jointe à cet e-mail sous forme de fichier PDF.

Nous avons hâte de vous voir bientôt !

{{config.name}}`,
      },
    ],
  });
