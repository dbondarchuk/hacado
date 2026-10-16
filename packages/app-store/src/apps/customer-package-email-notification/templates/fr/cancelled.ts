import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packageCancelledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-cancelled-email",
    name: "Forfait annulé",
    subject: "Votre forfait a été annulé - {{package.name}}",
    previewText: "Your package was cancelled",
    content: [
      {
        type: "title",
        text: "Votre colis a été annulé",
      },
      {
        type: "text",
        text: "Bonjour {{customer.name}},\n\nVotre forfait **{{package.name}}** a été annulé. Veuillez nous contacter si vous avez des questions.\n\nCordialement,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} crédits{{#package.expiresAt}} · expire le {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
