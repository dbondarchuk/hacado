import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentCreatedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-created-email",
    name: "Новий запит на запис (email)",
    subject: "Ми отримали ваш запит на запис",
    content: [
      {
        type: "title",
        text: "Новий запит на запис для послуги {{option.name}}",
      },
      {
        type: "text",
        text: `Привіт, {{fields.name}}!

Дякуємо, що обрали {{config.name}}!

Ми незабаром підтвердимо ваш запис на {{dateTime.full}}.

Послуга: {{option.name}}

Спеціаліст: {{member.name}}`,
      },
      addonsSelectedBlock("Додаткові опції: {{#addons}}{{name}}, {{/addons}}"),
      {
        type: "text",
        text: `Час: {{dateTime.full}}

Тривалість: {{#duration.hours}}{{.}} год {{/duration.hours}}{{#duration.minutes}}{{.}} хв{{/duration.minutes}}

Вартість: \${{totalPriceFormatted}}

З нетерпінням чекаємо на зустріч!

З повагою,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
