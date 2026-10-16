import { TemplatesTemplate } from "@hacado/types";
export const appointmentConfirmedTextMessageTemplate: TemplatesTemplate = {
  name: "Mensaje de texto de cita confirmada",
  type: "text-message",
  value:
    "Hola {{fields.name}},\n¡Gracias por seleccionar {{config.name}}!\nHemos confirmado su cita el {{dateTime.full}} para {{ option.name }} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}.\n\n¡Llámenos o envíenos un mensaje al {{config.phone}} si tiene alguna pregunta!\n\n¡Esperamos verte!\n{{config.name}}",
};
