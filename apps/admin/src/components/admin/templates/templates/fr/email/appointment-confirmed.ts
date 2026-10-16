import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentConfirmedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-confirmed-email",
    name: "E-mail de rendez-vous confirmé",
    subject: "Rendez-vous confirmé",
    content: [
      {
        type: "title",
        text: "Le rendez-vous pour {{option.name}} a été confirmé",
      },
      {
        type: "text",
        text: `Bonjour {{fields.name}},

Merci d'avoir sélectionné {{config.name}} !

Nous avons confirmé votre rendez-vous le {{dateTime.full}}

Service demandé : {{option.name}}

Spécialiste : {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}`,
      },
      addonsSelectedBlock(
        "Modules complémentaires sélectionnés : {{#addons}}{{name}}, {{/addons}}",
      ),
      {
        type: "text",
        text: `Heure : {{dateTime.full}}

Durée : {{#duration.hours}}{{.}} heures {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}

Prix : {{totalPriceFormatted}}

Nous avons hâte de vous voir !

Cordialement,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
