import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentCreatedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-created-email",
    name: "Correo electrónico de nueva cita",
    subject: "Su solicitud de cita ha sido recibida",
    content: [
      {
        type: "title",
        text: "Nueva solicitud de cita para {{service.name}}",
      },
      {
        type: "text",
        text: `Hola {{fields.name}},

¡Gracias por seleccionar {{config.name}}!

Confirmaremos su cita para {{dateTime.full}} en breve

Servicio solicitado: {{service.name}}

Especialista: {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}`,
      },
      addonsSelectedBlock(
        "Complementos seleccionados: {{#addons}}{{name}}, {{/addons}}",
      ),
      {
        type: "text",
        text: `Hora: {{dateTime.full}}

Duración: {{#duration.hours}}{{.}} h {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}

Precio: {{totalPriceFormatted}}

¡Estamos deseando verte!

Saludos cordiales,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
