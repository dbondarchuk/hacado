import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentDeclinedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-declined-email",
    name: "Відхилення запису (email)",
    subject: "Ваш запис не підтверджено",
    content: [
      {
        type: "title",
        text: "Запис на послугу {{option.name}} було скасовано",
      },
      {
        type: "text",
        text: `Привіт, {{fields.name}}!

Дякуємо, що обрали {{config.name}}!

На жаль, ми не можемо підтвердити ваш візит на послугу {{option.name}} {{dateTime.full}} з {{member.name}}.

Будь ласка, зателефонуйте нам за номером {{config.phone}} або оберіть інший час.

Перепрошуємо за незручності!

З повагою,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
