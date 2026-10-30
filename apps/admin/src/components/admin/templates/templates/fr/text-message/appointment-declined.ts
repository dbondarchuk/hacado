import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentDeclinedTextMessageTemplate: TemplatesTemplate = {
  name: "SMS de rendez-vous refusé",
  type: "text-message",
  value:
    "Bonjour {{fields.name}},\nVotre rendez-vous pour {{service.name}} le {{dateTime.full}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} a été refusé ou annulé.\n\nVeuillez nous appeler ou nous envoyer un message au {{config.phone}} si vous avez des questions !\n\nAu plaisir de vous voir !\n{{config.name}}",
};
