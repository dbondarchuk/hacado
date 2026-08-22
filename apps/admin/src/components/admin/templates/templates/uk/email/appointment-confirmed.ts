import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentConfirmedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-confirmed-email",
    name: "Підтвердження візиту (email)",
    subject: "Ваш візит підтверджено",
    content: [
      {
        type: "title",
        text: "Візит на послугу {{option.name}} підтверджено",
      },
      {
        type: "text",
        text: `Привіт, {{fields.name}}!

Дякуємо, що обрали {{config.name}}!

Ми підтвердили ваш візит на {{dateTime.full}}.

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
