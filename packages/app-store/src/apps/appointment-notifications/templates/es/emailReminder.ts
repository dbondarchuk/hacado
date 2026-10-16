import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentReminderEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-reminder-email",
    name: "Correo electrónico de recordatorio de cita",
    subject: "Recordatorio sobre tu cita",
    content: [
      {
        type: "title",
        text: "Recordatorio sobre su cita para {{option.name}} el {{dateTime.full}}",
      },
      {
        type: "text",
        text: `Hola {{fields.name}},

Este es un recordatorio amistoso sobre su próxima cita el {{dateTime.full}} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}.

¡Estamos deseando verte!

Saludos cordiales,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
