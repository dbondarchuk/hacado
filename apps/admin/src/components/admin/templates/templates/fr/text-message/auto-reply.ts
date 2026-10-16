import { TemplatesTemplate } from "@hacado/types";

export const autoReplyTextMessageTemplate: TemplatesTemplate = {
  name: "Réponse automatique aux SMS",
  type: "text-message",
  value:
    "Salut{{#customer.name}} {{.}}{{/customer.name}},\nIl s'agit d'un numéro de téléphone non surveillé. Veuillez envoyer votre réponse à {{config.phone}}.\n\nMerci,\n{{config.name}}",
};
