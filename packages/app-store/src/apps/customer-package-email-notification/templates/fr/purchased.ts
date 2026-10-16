import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packagePurchasedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-purchased-email",
    name: "Forfait acheté",
    subject: "Votre achat de forfait - {{package.name}}",
    previewText: "Your package is ready to use",
    content: [
      {
        type: "title",
        text: "Merci pour votre achat de forfait !",
      },
      {
        type: "text",
        text: "Bonjour {{customer.name}},\n\nVotre forfait **{{package.name}}** est prêt à être utilisé. Il vous reste **{{package.remainingCredits}}** de **{{package.totalCredits}}** crédits.\n\nCordialement,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} crédits{{#package.expiresAt}} · expire le {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
