import { TemplatesTemplate } from "@timelish/types";

export const appointmentReminderTextMessageTemplate: TemplatesTemplate = {
  name: "Нагадування про візит (текстовий)",
  type: "text-message",
  value:
    "Привіт, {{fields.name}}!\nЦе дружнє нагадування про ваш майбутній запис {{dateTime.full}} з {{member.name}}.\n\nЯкщо у вас є запитання, зателефонуйте або напишіть нам за номером {{config.phone}}.\n\nЗ нетерпінням чекаємо на зустріч!\n{{config.name}}",
};
