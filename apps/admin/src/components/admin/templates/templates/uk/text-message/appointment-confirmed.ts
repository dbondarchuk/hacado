import { TemplatesTemplate } from "@timelish/types";
export const appointmentConfirmedTextMessageTemplate: TemplatesTemplate = {
  name: "Підтвердження запису (текстовий)",
  type: "text-message",
  value:
    "Привіт, {{fields.name}}!\nДякуємо, що обрали {{config.name}}!\nМи підтвердили ваш запис {{dateTime.full}} на послугу {{ option.name }} з {{member.name}}.\n\nЯкщо у вас є запитання, зателефонуйте або напишіть нам за номером {{config.phone}}.\n\nЗ нетерпінням чекаємо на зустріч!\n{{config.name}}",
};
