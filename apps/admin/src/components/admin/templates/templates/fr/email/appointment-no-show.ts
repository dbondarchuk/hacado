import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentNoShowEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-no-show-email",
    name: "E-mail de rendez-vous en cas de non-présentation",
    subject: "Rendez-vous marqué comme non-présentation",
    content: [
      {
        type: "title",
        text: "Vous avez été marqué comme non-présentation pour {{service.name}}",
      },
      {
        type: "text",
        text: `Bonjour {{fields.name}},

Merci d'avoir sélectionné {{config.name}} !

Nous avons enregistré que vous n'étiez pas présent à votre rendez-vous du {{service.name}} le {{dateTime.full}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}.

Veuillez nous appeler au {{config.phone}} si vous souhaitez réserver une autre fois.

Nous nous excusons pour la gêne occasionnée !

Cordialement,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
