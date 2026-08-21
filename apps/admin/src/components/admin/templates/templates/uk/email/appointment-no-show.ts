import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentNoShowEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-no-show-email",
    name: "Неявка на запис (email)",
    subject: "Запис позначено як неявку",
    content: [
      {
        type: "title",
        text: "Вас позначено як неявку на {{option.name}}",
      },
      {
        type: "text",
        text: `Привіт, {{fields.name}}!

Дякуємо, що обрали {{config.name}}!

Ми зафіксували, що ви не були на візиті на послугу {{option.name}} {{dateTime.full}} з {{member.name}}.

Будь ласка, зателефонуйте нам за номером {{config.phone}}, якщо хочете обрати інший час.

Перепрошуємо за незручності!

З повагою,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
