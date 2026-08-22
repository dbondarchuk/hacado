import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentCanceledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-canceled-email",
    name: "Скасування запису (email)",
    subject: "Ваш запис скасовано",
    content: [
      {
        type: "title",
        text: "Ваш запис на послугу {{option.name}} скасовано",
      },
      {
        type: "text",
        text: `Привіт, {{fields.name}}!

Дякуємо, що обрали {{config.name}}!

Підтверджуємо, що ваш візит на послугу {{option.name}} {{dateTime.full}} з {{member.name}} скасовано.

Будь ласка, зателефонуйте нам за номером {{config.phone}}, якщо хочете обрати інший час.

Сподіваємося побачити вас знову!

З повагою,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
