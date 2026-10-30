import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const packageCancelledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-cancelled-email",
    name: "Paquete cancelado",
    subject: "Su paquete fue cancelado - {{package.name}}",
    previewText: "Your package was cancelled",
    content: [
      {
        type: "title",
        text: "Tu paquete fue cancelado",
      },
      {
        type: "text",
        text: "Hola {{customer.name}},\n\nSu paquete **{{package.name}}** ha sido cancelado. Por favor contáctenos si tiene preguntas.\n\nSaludos cordiales,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} créditos{{#package.expiresAt}} · vence {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
