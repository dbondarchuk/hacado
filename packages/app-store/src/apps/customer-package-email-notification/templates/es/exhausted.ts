import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packageExhaustedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-exhausted-email",
    name: "Paquete agotado",
    subject: "Los créditos de su paquete están agotados: {{package.name}}",
    previewText: "Your package credits are used up",
    content: [
      {
        type: "title",
        text: "Los créditos de tu paquete están agotados.",
      },
      {
        type: "text",
        text: "Hola {{customer.name}},\n\nHas utilizado todos los créditos el **{{package.name}}**. Contáctenos si desea comprar otro paquete.\n\nSaludos cordiales,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} créditos{{#package.expiresAt}} · vence {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
