import { TemplatesTemplate } from "@hacado/types";

export const appointmentCanceledTextMessageTemplate: TemplatesTemplate = {
  name: "SMS de rendez-vous annulé",
  type: "text-message",
  value:
    "Bonjour {{fields.name}},\nVotre rendez-vous pour {{ option.name }} le {{dateTime.full}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} a été annulé.\n\nVeuillez nous appeler ou nous envoyer un message au {{config.phone}} si vous souhaitez réserver une autre heure.\n\n{{config.name}}",
};
