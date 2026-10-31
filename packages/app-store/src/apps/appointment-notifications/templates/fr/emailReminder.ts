import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentReminderEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-reminder-email",
    name: "E-mail de rappel de rendez-vous",
    subject: "Rappel de votre rendez-vous",
    content: [
      {
        type: "title",
        text: "Rappel de votre rendez-vous pour {{service.name}} le {{dateTime.full}}",
      },
      {
        type: "text",
        text: `Bonjour {{fields.name}},

Ceci est un rappel amical concernant votre prochain rendez-vous le {{dateTime.full}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}.

Nous avons hâte de vous voir !

Cordialement,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
