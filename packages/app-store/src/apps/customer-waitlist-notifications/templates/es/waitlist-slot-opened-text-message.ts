import { TemplatesTemplate } from "@hacado/types/templates";

export const waitlistSlotOpenedTextMessageTemplate: TemplatesTemplate = {
  name: "Mensaje de texto con espacio en lista de espera abierto",
  type: "text-message",
  value:
    "Hola {{waitlistEntry.name}}, {{#isMorning}}una mañana{{/isMorning}}{{#isAfternoon}}una tarde{{/isAfternoon}}{{#isEvening}}una tarde{{/isEvening}} horario abierto para {{waitlistEntry.service.name}} con {{waitlistEntry.member.name}}{{#waitlistEntry.member.jobTitle}} ({{waitlistEntry.member.jobTitle}}){{/waitlistEntry.member.jobTitle}} el {{slotDateTime.full}}{{#hasOtherTimes}} (y otros horarios también){{/hasOtherTimes}}.\n\nLibro: {{bookingUrl}}\nSalir de la lista de espera: {{leaveWaitlistUrl}}\n\nResponda {{smsRemoveKeyword}} para abandonar esta solicitud de lista de espera.",
};
