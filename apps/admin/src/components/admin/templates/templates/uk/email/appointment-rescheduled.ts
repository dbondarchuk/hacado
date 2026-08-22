import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentRescheduledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-rescheduled-email",
    name: "Перенесення запису (email)",
    subject: "Ваш запис було перенесено",
    content: [
      {
        type: "title",
        text: "Запис на послугу {{option.name}} було перенесено",
      },
      {
        type: "text",
        text: `Привіт, {{fields.name}}!

Дякуємо, що обрали {{config.name}}!

Ваш візит на послугу {{option.name}} з {{member.name}} було перенесено на {{dateTime.full}} з тривалістю: {{#duration.hours}}{{.}} год {{/duration.hours}}{{#duration.minutes}}{{.}} хв{{/duration.minutes}}.

Будь ласка, зателефонуйте нам за номером {{config.phone}} якомога швидше, якщо цей час вам не підходить.

З нетерпінням чекаємо на зустріч!

З повагою,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
