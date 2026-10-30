import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const packagePurchasedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-purchased-email",
    name: "Paquete comprado",
    subject: "Compra de tu paquete - {{package.name}}",
    previewText: "Your package is ready to use",
    content: [
      {
        type: "title",
        text: "¡Gracias por la compra de tu paquete!",
      },
      {
        type: "text",
        text: "Hola {{customer.name}},\n\nSu paquete **{{package.name}}** está listo para usar. Te quedan **{{package.remainingCredits}}** de **{{package.totalCredits}}** créditos.\n\nSaludos cordiales,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} créditos{{#package.expiresAt}} · vence {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
