import {
  EMAIL_BRAND,
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const waitlistSlotOpenedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "waitlist-slot-opened-email",
    name: "E-mail ouvert sur liste d'attente",
    subject: "Une heure ouverte pour {{waitlistEntry.service.name}}",
    content: [
      {
        type: "title",
        text: "Un créneau horaire vient d'être ouvert",
      },
      {
        type: "text",
        text: `Bonjour {{waitlistEntry.name}},

Une heure correspondant à votre demande de liste d'attente est disponible{{#isMorning}} le matin{{/isMorning}}{{#isAfternoon}} l'après-midi{{/isAfternoon}}{{#isEvening}} le soir{{/isEvening}} :

Service : {{waitlistEntry.service.name}}
Spécialiste : {{waitlistEntry.member.name}}{{#waitlistEntry.member.jobTitle}} ({{waitlistEntry.member.jobTitle}}){{/waitlistEntry.member.jobTitle}}
Quand : {{slotDateTime.full}}{{#hasOtherTimes}} (et à d'autres moments également){{/hasOtherTimes}}

Réservez maintenant pour réclamer cette fois. Si vous n’en avez plus besoin, vous pouvez quitter la liste d’attente.`,
      },
      addonsSelectedBlock(
        "Modules complémentaires sélectionnés : {{#addons}}{{name}}, {{/addons}}",
      ),
      {
        type: "button",
        button: {
          text: "Réservez cette fois",
          url: "{{bookingUrl}}",
        },
      },
      {
        type: "button",
        button: {
          text: "Quitter la liste d'attente",
          url: "{{leaveWaitlistUrl}}",
          backgroundColor: EMAIL_BRAND.destructive,
        },
      },
      {
        type: "text",
        text: `Cordialement,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
