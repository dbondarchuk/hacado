import { TemplatesTemplate } from "@hacado/types/templates";
export const appointmentConfirmedTextMessageTemplate: TemplatesTemplate = {
  name: "SMS de rendez-vous confirmé",
  type: "text-message",
  value:
    "Bonjour {{fields.name}},\nMerci d'avoir sélectionné {{config.name}} !\nNous avons confirmé votre rendez-vous le {{dateTime.full}} pour le {{service.name}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}.\n\nVeuillez nous appeler ou nous envoyer un message au {{config.phone}} si vous avez des questions !\n\nAu plaisir de vous voir !\n{{config.name}}",
};
