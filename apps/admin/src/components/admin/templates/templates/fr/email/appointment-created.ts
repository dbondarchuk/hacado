import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentCreatedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-created-email",
    name: "E-mail de nouveau rendez-vous",
    subject: "Votre demande de rendez-vous a été reçue",
    content: [
      {
        type: "title",
        text: "Nouvelle demande de rendez-vous pour {{service.name}}",
      },
      {
        type: "text",
        text: `Bonjour {{fields.name}},

Merci d'avoir sélectionné {{config.name}} !

Nous confirmerons votre rendez-vous pour le {{dateTime.full}} sous peu

Service demandé : {{service.name}}

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
