import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentNoShowEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-no-show-email",
    name: "Correo electrónico de cita por no presentarse",
    subject: "Cita marcada como no presentación",
    content: [
      {
        type: "title",
        text: "Fuiste marcado como no presentado por {{option.name}}",
      },
      {
        type: "text",
        text: `Hola {{fields.name}},

¡Gracias por seleccionar {{config.name}}!

Registramos que no asistió a su cita de {{option.name}} el {{dateTime.full}} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}.

Llámenos al {{config.phone}} si desea reservar en otro momento.

¡Pedimos disculpas por las molestias!

Saludos cordiales,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
