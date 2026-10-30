import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentDeclinedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-declined-email",
    name: "E-mail de rendez-vous refusé",
    subject: "Rendez-vous refusé",
    content: [
      {
        type: "title",
        text: "Le rendez-vous pour {{service.name}} a été annulé",
      },
      {
        type: "text",
        text: `Bonjour {{fields.name}},

Merci d'avoir sélectionné {{config.name}} !

Malheureusement, nous ne pouvons pas confirmer votre rendez-vous pour le {{service.name}} le {{dateTime.full}} avec {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} pour le moment.

Veuillez nous appeler au {{config.phone}} ou essayer de sélectionner une autre heure.

Nous nous excusons pour la gêne occasionnée !

Cordialement,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
