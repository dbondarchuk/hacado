import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentReminderEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-reminder-email",
    name: "Нагадування про запис (email)",
    subject: "Нагадування про ваш запис",
    content: [
      {
        type: "title",
        text: "Нагадування про ваш візит на послугу {{option.name}} {{dateTime.full}}",
      },
      {
        type: "text",
        text: `Привіт, {{fields.name}}!

Це дружнє нагадування про ваш майбутній візит {{dateTime.full}} з {{member.name}}.

З нетерпінням чекаємо на зустріч!

З повагою,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
