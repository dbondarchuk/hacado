import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const packageExpiringSoonEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-expiring-soon-email",
    name: "El paquete expirará pronto",
    subject: "Su paquete caduca pronto - {{package.name}}",
    previewText: "Your package is expiring soon",
    content: [
      {
        type: "title",
        text: "Su paquete expirará pronto",
      },
      {
        type: "text",
        text: "Hola {{customer.name}},\n\nSu paquete **{{package.name}}** vence el **{{package.expiresAt.full}}**. Todavía te quedan **{{package.remainingCredits}}** de **{{package.totalCredits}}** créditos; reserva pronto para que no se queden sin usar.\n\nSaludos cordiales,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} créditos{{#package.expiresAt}} · vence {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
