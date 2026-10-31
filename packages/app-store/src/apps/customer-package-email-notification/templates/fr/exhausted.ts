import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const packageExhaustedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-exhausted-email",
    name: "Colis épuisé",
    subject: "Vos crédits de forfait sont épuisés - {{package.name}}",
    previewText: "Your package credits are used up",
    content: [
      {
        type: "title",
        text: "Vos crédits de forfait sont épuisés",
      },
      {
        type: "text",
        text: "Bonjour {{customer.name}},\n\nVous avez utilisé tous les crédits le **{{package.name}}**. Contactez-nous si vous souhaitez acheter un autre forfait.\n\nCordialement,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} crédits{{#package.expiresAt}} · expire le {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
