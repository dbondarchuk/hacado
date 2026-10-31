import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentNoShowEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-no-show-email",
    name: "Неявка на запис (email)",
    subject: "Запис позначено як неявку",
    content: [
      {
        type: "title",
        text: "Вас позначено як неявку на {{service.name}}",
      },
      {
        type: "text",
        text: `Привіт, {{fields.name}}!

Дякуємо, що обрали {{config.name}}!

Ми зафіксували, що ви не були на візиті на послугу {{service.name}} {{dateTime.full}} з {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}.

Будь ласка, зателефонуйте нам за номером {{config.phone}}, якщо хочете обрати інший час.

Перепрошуємо за незручності!

З повагою,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
