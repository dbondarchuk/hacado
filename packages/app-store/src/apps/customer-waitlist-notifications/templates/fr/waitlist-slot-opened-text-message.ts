import { TemplatesTemplate } from "@hacado/types/templates";

export const waitlistSlotOpenedTextMessageTemplate: TemplatesTemplate = {
  name: "Emplacement sur liste d'attente ouvert, SMS",
  type: "text-message",
  value:
    "Salut {{waitlistEntry.name}}, {{#isMorning}}un matin{{/isMorning}}{{#isAfternoon}}un après-midi{{/isAfternoon}}{{#isEvening}}un soir{{/isEvening}} heure ouverte pour {{waitlistEntry.service.name}} avec {{waitlistEntry.member.name}}{{#waitlistEntry.member.jobTitle}} ({{waitlistEntry.member.jobTitle}}){{/waitlistEntry.member.jobTitle}} le {{slotDateTime.full}}{{#hasOtherTimes}} (et d'autres heures aussi){{/hasOtherTimes}}.\n\n" +
    // "Livre : {{bookingUrl}}\nQuittez la liste d'attente : {{leaveWaitlistUrl}}\n\n" +
    "Répondez {{smsRemoveKeyword}} pour quitter cette demande de liste d'attente.",
};
