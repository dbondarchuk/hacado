import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentRescheduledTextMessageTemplate: TemplatesTemplate = {
  name: "SMS de rendez-vous reprogrammé",
  type: "text-message",
  value:
    "Bonjour {{fields.name}},\nVotre rendez-vous du {{service.name}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} a été reporté au {{dateTime.full}}.\n\nVeuillez nous appeler ou nous envoyer un message au {{config.phone}} si vous avez des questions !\n\nAu plaisir de vous voir !\n{{config.name}}",
};
