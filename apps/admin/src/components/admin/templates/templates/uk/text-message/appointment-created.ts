import { TemplatesTemplate } from "@timelish/types";

export const appointmentCreatedTextMessageTemplate: TemplatesTemplate = {
  name: "Запит на запис (текстовий)",
  type: "text-message",
  value:
    "Привіт, {{fields.name}}!\nДякуємо, що обрали {{config.name}}!\nМи отримали ваш запит на запис {{dateTime.full}} на послугу {{ option.name }} з {{member.name}}. Ми підтвердимо його найближчим часом.\n\nТим часом, якщо у вас є запитання, зателефонуйте або напишіть нам за номером {{config.phone}}.\n\nЗ нетерпінням чекаємо на зустріч!\n{{config.name}}",
};
