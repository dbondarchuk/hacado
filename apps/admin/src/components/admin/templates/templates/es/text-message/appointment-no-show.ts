import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentNoShowTextMessageTemplate: TemplatesTemplate = {
  name: "Mensaje de texto de cita por no presentarse",
  type: "text-message",
  value:
    "Hola {{fields.name}},\nRegistramos que no asistió a su cita de {{service.name}} el {{dateTime.full}} con {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}.\n\nLlámenos o envíenos un mensaje al {{config.phone}} si desea reservar en otro momento.\n\n{{config.name}}",
};
