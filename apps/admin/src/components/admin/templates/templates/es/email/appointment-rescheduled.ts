import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentRescheduledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-rescheduled-email",
    name: "Correo electrónico de cita reprogramada",
    subject: "Cita reprogramada",
    content: [
      {
        type: "title",
        text: "Se reprogramó la cita para {{service.name}}",
      },
      {
        type: "text",
        text: `Hola {{fields.name}},

¡Gracias por seleccionar {{config.name}}!

Su cita para {{service.name}} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} fue reprogramada{{#oldDateTime}} de {{oldDateTime.full}}{{/oldDateTime}} a {{dateTime.full}} y duración: {{#duration.hours}}{{.}} hr {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}.

Llámenos al {{config.phone}} lo antes posible si este horario no le conviene.

¡Estamos deseando verte!

Saludos cordiales,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
