import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const waitlistEntryCreatedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "waitlist-entry-created-email",
    name: "Nouvel e-mail d'inscription sur la liste d'attente",
    subject: "Merci d'avoir rejoint la liste d'attente !",
    content: [
      {
        type: "title",
        text: "Merci d'avoir rejoint la liste d'attente !",
      },
      {
        type: "text",
        text: `Bonjour {{waitlistEntry.name}},

Merci d'avoir sélectionné {{config.name}} !

Nous avons reçu votre demande d'inscription sur notre liste d'attente.

Nous vous contacterons dès qu'un créneau horaire sera disponible pour la date souhaitée.

Service demandé : {{waitlistEntry.option.name}}

Spécialiste : {{waitlistEntry.member.name}}{{#waitlistEntry.member.jobTitle}} ({{waitlistEntry.member.jobTitle}}){{/waitlistEntry.member.jobTitle}}`,
      },
      addonsSelectedBlock(
        "Modules complémentaires sélectionnés : {{#addons}}{{name}}, {{/addons}}",
      ),
      {
        type: "text",
        text: `Nous avons hâte de vous voir !

Cordialement,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
