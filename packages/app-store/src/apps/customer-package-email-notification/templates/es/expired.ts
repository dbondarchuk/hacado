import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packageExpiredEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-expired-email",
    name: "Paquete caducado",
    subject: "Su paquete ha caducado - {{package.name}}",
    previewText: "Your package has expired",
    content: [
      {
        type: "title",
        text: "Tu paquete ha caducado",
      },
      {
        type: "text",
        text: "Hola {{customer.name}},\n\nSu paquete **{{package.name}}** ha caducado. Los créditos restantes no utilizados ya no están disponibles.\n\nSaludos cordiales,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} créditos{{#package.expiresAt}} · vence {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
