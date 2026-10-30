import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentDeclinedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-declined-email",
    name: "Correo electrónico de cita rechazada",
    subject: "Cita rechazada",
    content: [
      {
        type: "title",
        text: "La cita para {{service.name}} fue cancelada",
      },
      {
        type: "text",
        text: `Hola {{fields.name}},

¡Gracias por seleccionar {{config.name}}!

Desafortunadamente, no podemos confirmar su cita para {{service.name}} el {{dateTime.full}} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} en este momento.

Llámenos al {{config.phone}} o intente seleccionar otro horario.

¡Pedimos disculpas por las molestias!

Saludos cordiales,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
