import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentConfirmedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-confirmed-email",
    name: "Correo electrónico de cita confirmada",
    subject: "Cita confirmada",
    content: [
      {
        type: "title",
        text: "Se confirmó la cita para {{option.name}}",
      },
      {
        type: "text",
        text: `Hola {{fields.name}},

¡Gracias por seleccionar {{config.name}}!

Hemos confirmado su cita el {{dateTime.full}}

Servicio solicitado: {{option.name}}

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
