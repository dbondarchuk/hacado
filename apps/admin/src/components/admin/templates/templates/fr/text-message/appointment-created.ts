import { TemplatesTemplate } from "@hacado/types";

export const appointmentCreatedTextMessageTemplate: TemplatesTemplate = {
  name: "Nouveau SMS de demande de rendez-vous",
  type: "text-message",
  value:
    "Bonjour {{fields.name}},\nMerci d'avoir sélectionné {{config.name}} !\nNous avons reçu votre demande de rendez-vous le {{dateTime.full}} pour le {{service.name}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}. Nous le confirmerons prochainement.\n\nEn attendant, n'hésitez pas à m'appeler ou à m'envoyer un message au {{config.phone}} si vous avez des questions !\n\nAu plaisir de vous voir !\n{{config.name}}",
};
