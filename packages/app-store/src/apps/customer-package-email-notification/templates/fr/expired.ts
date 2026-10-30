import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const packageExpiredEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-expired-email",
    name: "Forfait expiré",
    subject: "Votre forfait a expiré - {{package.name}}",
    previewText: "Your package has expired",
    content: [
      {
        type: "title",
        text: "Votre forfait a expiré",
      },
      {
        type: "text",
        text: "Bonjour {{customer.name}},\n\nVotre forfait **{{package.name}}** a expiré. Les crédits restants inutilisés ne sont plus disponibles.\n\nCordialement,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} crédits{{#package.expiresAt}} · expire le {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
