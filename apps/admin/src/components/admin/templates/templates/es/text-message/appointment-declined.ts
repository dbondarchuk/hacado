import { TemplatesTemplate } from "@hacado/types";

export const appointmentDeclinedTextMessageTemplate: TemplatesTemplate = {
  name: "Mensaje de texto de cita rechazada",
  type: "text-message",
  value:
    "Hola {{fields.name}},\nSu cita para {{service.name}} el {{dateTime.full}} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} fue rechazada o cancelada.\n\n¡Llámenos o envíenos un mensaje al {{config.phone}} si tiene alguna pregunta!\n\n¡Esperamos verte!\n{{config.name}}",
};
