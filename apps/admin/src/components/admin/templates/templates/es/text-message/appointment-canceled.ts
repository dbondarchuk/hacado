import { TemplatesTemplate } from "@hacado/types";

export const appointmentCanceledTextMessageTemplate: TemplatesTemplate = {
  name: "Mensaje de texto de cita cancelada",
  type: "text-message",
  value:
    "Hola {{fields.name}},\nSu cita para {{service.name}} el {{dateTime.full}} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} ha sido cancelada.\n\nLlámenos o envíenos un mensaje al {{config.phone}} si desea reservar en otro momento.\n\n{{config.name}}",
};
