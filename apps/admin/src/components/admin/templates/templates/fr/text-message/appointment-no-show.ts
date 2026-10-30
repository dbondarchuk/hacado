import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentNoShowTextMessageTemplate: TemplatesTemplate = {
  name: "SMS de rendez-vous de non-présentation",
  type: "text-message",
  value:
    "Bonjour {{fields.name}},\nNous avons enregistré que vous n'étiez pas présent à votre rendez-vous du {{service.name}} le {{dateTime.full}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}.\n\nVeuillez nous appeler ou nous envoyer un message au {{config.phone}} si vous souhaitez réserver une autre heure.\n\n{{config.name}}",
};
