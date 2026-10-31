import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentRescheduledTextMessageTemplate: TemplatesTemplate = {
  name: "Mensaje de texto de cita reprogramada",
  type: "text-message",
  value:
    "Hola {{fields.name}},\nSu cita para {{service.name}} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} fue reprogramada para {{dateTime.full}}.\n\n¡Llámenos o envíenos un mensaje al {{config.phone}} si tiene alguna pregunta!\n\n¡Esperamos verte!\n{{config.name}}",
};
