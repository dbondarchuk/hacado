import { TemplatesTemplate } from "@hacado/types";

export const appointmentCreatedTextMessageTemplate: TemplatesTemplate = {
  name: "Nuevo mensaje de texto de solicitud de cita",
  type: "text-message",
  value:
    "Hola {{fields.name}},\n¡Gracias por seleccionar {{config.name}}!\nHemos recibido su solicitud de cita el {{dateTime.full}} para {{ option.name }} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}. Lo confirmaremos en breve.\n\nMientras tanto, llámeme o envíeme un mensaje al {{config.phone}} si tiene alguna pregunta.\n\n¡Esperamos verte!\n{{config.name}}",
};
