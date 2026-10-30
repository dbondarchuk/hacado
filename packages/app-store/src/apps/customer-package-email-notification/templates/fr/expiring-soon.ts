import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const packageExpiringSoonEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-expiring-soon-email",
    name: "Forfait expirant bientôt",
    subject: "Votre forfait expire bientôt - {{package.name}}",
    previewText: "Your package is expiring soon",
    content: [
      {
        type: "title",
        text: "Votre forfait expire bientôt",
      },
      {
        type: "text",
        text: "Bonjour {{customer.name}},\n\nVotre forfait **{{package.name}}** expire le **{{package.expiresAt.full}}**. Il vous reste encore **{{package.remainingCredits}}** de **{{package.totalCredits}}** crédits. Réservez vite pour qu'ils ne restent pas inutilisés.\n\nCordialement,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} crédits{{#package.expiresAt}} · expire le {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
