import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentCanceledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-canceled-email",
    name: "E-mail de rendez-vous annulé",
    subject: "Rendez-vous annulé",
    content: [
      {
        type: "title",
        text: "Votre rendez-vous pour {{option.name}} a été annulé",
      },
      {
        type: "text",
        text: `Bonjour {{fields.name}},

Merci d'avoir sélectionné {{config.name}} !

Cela confirme que votre rendez-vous pour {{option.name}} le {{dateTime.full}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} a été annulé.

Veuillez nous appeler au {{config.phone}} si vous souhaitez réserver une autre fois.

Nous espérons vous revoir bientôt !

Cordialement,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
