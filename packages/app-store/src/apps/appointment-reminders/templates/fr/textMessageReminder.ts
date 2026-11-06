import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentReminderTextMessageTemplate: TemplatesTemplate = {
  name: "SMS de rappel de rendez-vous",
  type: "text-message",
  value:
    "Bonjour {{fields.name}},\nCeci est un rappel amical concernant votre prochain rendez-vous le {{dateTime.full}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}.\n\nVeuillez nous appeler ou nous envoyer un message au {{config.phone}} si vous avez des questions !\n\nAu plaisir de vous voir !\n{{config.name}}",
};
