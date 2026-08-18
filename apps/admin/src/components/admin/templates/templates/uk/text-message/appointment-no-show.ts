import { TemplatesTemplate } from "@hacado/types";

export const appointmentNoShowTextMessageTemplate: TemplatesTemplate = {
  name: "Неявка на запис (текстовий)",
  type: "text-message",
  value:
    "Привіт, {{fields.name}}!\nМи зафіксували, що ви не були на записі на послугу {{ option.name }} {{dateTime.full}} з {{member.name}}.\n\nЯкщо хочете обрати інший час, зателефонуйте або напишіть нам за номером {{config.phone}}.\n\n{{config.name}}",
};
