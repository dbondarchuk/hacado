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
    name: "Email про вільний слот у листі очікування",
    subject: "Звільнився час для {{waitlistEntry.option.name}}",
    content: [
      {
        type: "title",
        text: "Звільнився час",
      },
      {
        type: "text",
        text: `Привіт, {{waitlistEntry.name}}!

{{#isMorning}}Зранку{{/isMorning}}{{#isAfternoon}}Удень{{/isAfternoon}}{{#isEvening}}Увечері{{/isEvening}} з’явився час, який відповідає вашому запиту в листі очікування:

Послуга: {{waitlistEntry.option.name}}
Спеціаліст: {{waitlistEntry.member.name}}
Коли: {{slotDateTime.full}}{{#hasOtherTimes}} (і інші години теж){{/hasOtherTimes}}

Забронюйте зараз, щоб закріпити цей час. Якщо він більше не потрібен, ви можете вийти з листа очікування.`,
      },
      addonsSelectedBlock("Додаткові опції: {{#addons}}{{name}}, {{/addons}}"),
      {
        type: "button",
        button: {
          text: "Забронювати цей час",
          url: "{{bookingUrl}}",
        },
      },
      {
        type: "button",
        button: {
          text: "Вийти з листа очікування",
          url: "{{leaveWaitlistUrl}}",
          backgroundColor: EMAIL_BRAND.destructive,
        },
      },
      {
        type: "text",
        text: `З повагою,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
