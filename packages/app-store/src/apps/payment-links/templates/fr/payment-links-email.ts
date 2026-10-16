import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const paymentLinksEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "payment-links-email",
    name: "Lien de paiement",
    subject: "Demande de paiement de {{config.name}}",
    content: [
      {
        type: "title",
        text: "Vous avez une demande de paiement",
      },
      {
        type: "text",
        text: `Bonjour {{customer.name}},

{{config.name}} vous a envoyé une demande de paiement pour {{payment.amountFormatted}}.

Utilisez le bouton ci-dessous pour payer en toute sécurité.`,
      },
      {
        type: "button",
        button: {
          text: "Payez maintenant",
          url: "{{paymentLinkUrl}}",
        },
      },
      {
        type: "text",
        text: `Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
{{paymentLinkUrl}}

Cordialement,

{{config.name}}`,
      },
    ],
  });
