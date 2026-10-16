import { TemplatesTemplate } from "@hacado/types";

export const appointmentReminderTextMessageTemplate: TemplatesTemplate = {
  name: "Mensaje de texto de recordatorio de cita",
  type: "text-message",
  value:
    "Hola {{fields.name}},\nEste es un recordatorio amistoso sobre su próxima cita el {{dateTime.full}} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}.\n\n¡Llámenos o envíenos un mensaje al {{config.phone}} si tiene alguna pregunta!\n\n¡Esperamos verte!\n{{config.name}}",
};
