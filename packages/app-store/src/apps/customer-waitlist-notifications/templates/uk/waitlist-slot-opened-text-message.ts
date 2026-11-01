import { TemplatesTemplate } from "@hacado/types/templates";

export const waitlistSlotOpenedTextMessageTemplate: TemplatesTemplate = {
  name: "SMS про вільний слот у листі очікування",
  type: "text-message",
  value:
    "Привіт, {{waitlistEntry.name}}! {{#isMorning}}Зранку{{/isMorning}}{{#isAfternoon}}Удень{{/isAfternoon}}{{#isEvening}}Увечері{{/isEvening}} звільнився час для {{waitlistEntry.service.name}} зі спеціалістом {{waitlistEntry.member.name}}{{#waitlistEntry.member.jobTitle}} ({{waitlistEntry.member.jobTitle}}){{/waitlistEntry.member.jobTitle}} на {{slotDateTime.full}}{{#hasOtherTimes}} (і інші години теж){{/hasOtherTimes}}.\n\n" +
    // "Забронювати: {{bookingUrl}}\nВийти з листа очікування: {{leaveWaitlistUrl}}\n\n" +
    "Відповідьте {{smsRemoveKeyword}}, щоб скасувати цей запит.",
};
