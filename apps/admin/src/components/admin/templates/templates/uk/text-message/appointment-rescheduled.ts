import { TemplatesTemplate } from "@timelish/types";

export const appointmentRescheduledTextMessageTemplate: TemplatesTemplate = {
  name: "Перенесений запис (текстовий)",
  type: "text-message",
  value:
    "Привіт, {{fields.name}}!\nВаш запис на послугу {{option.name}} з {{member.name}} було перенесено на {{dateTime.full}}.\n\nЯкщо цей час вам не підходить або у вас є запитання, зателефонуйте чи напишіть нам за номером {{config.phone}}.\n\nЗ нетерпінням чекаємо на зустріч!\n{{config.name}}",
};
