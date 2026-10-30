import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentRescheduledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-rescheduled-email",
    name: "E-mail de rendez-vous reporté",
    subject: "Rendez-vous reporté",
    content: [
      {
        type: "title",
        text: "Le rendez-vous pour {{service.name}} a été reporté",
      },
      {
        type: "text",
        text: `Bonjour {{fields.name}},

Merci d'avoir sélectionné {{config.name}} !

Votre rendez-vous pour {{service.name}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} a été reporté{{#oldDateTime}} du {{oldDateTime.full}}{{/oldDateTime}} au {{dateTime.full}} et durée : {{#duration.hours}}{{.}} heures {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}.

Veuillez nous appeler au {{config.phone}} dès que possible si cette heure ne vous convient pas.

Nous avons hâte de vous voir !

Cordialement,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
