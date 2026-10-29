import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentCanceledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-canceled-email",
    name: "Correo electrónico de cita cancelada",
    subject: "Cita cancelada",
    content: [
      {
        type: "title",
        text: "Su cita para {{service.name}} fue cancelada",
      },
      {
        type: "text",
        text: `Hola {{fields.name}},

¡Gracias por seleccionar {{config.name}}!

Esto confirma que su cita para {{service.name}} el {{dateTime.full}} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} ha sido cancelada.

Llámenos al {{config.phone}} si desea reservar en otro momento.

¡Esperamos volver a verte pronto!

Saludos cordiales,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
