import { TemplatesTemplate } from "@hacado/types";

export const waitlistSlotOpenedTextMessageTemplate: TemplatesTemplate = {
  name: "SMS про вільний слот у листі очікування",
  type: "text-message",
  value:
    "Привіт, {{waitlistEntry.name}}! {{#isMorning}}Зранку{{/isMorning}}{{#isAfternoon}}Удень{{/isAfternoon}}{{#isEvening}}Увечері{{/isEvening}} звільнився час для {{waitlistEntry.option.name}} зі спеціалістом {{waitlistEntry.member.name}} на {{slotDateTime.full}}{{#hasOtherTimes}} (і інші години теж){{/hasOtherTimes}}.\n\nЗабронювати: {{bookingUrl}}\nВийти з листа очікування: {{leaveWaitlistUrl}}\n\nВідповідьте {{smsRemoveKeyword}}, щоб скасувати цей запит.",
};
