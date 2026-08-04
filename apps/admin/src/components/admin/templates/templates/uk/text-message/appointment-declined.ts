import { TemplatesTemplate } from "@timelish/types";

export const appointmentDeclinedTextMessageTemplate: TemplatesTemplate = {
  name: "Відхилення запису (текстовий)",
  type: "text-message",
  value:
    "Привіт, {{fields.name}}!\nВаш запис на послугу {{ option.name }} {{dateTime.full}} з {{member.name}} було відхилено або скасовано.\n\nЯкщо у вас є запитання, зателефонуйте або напишіть нам за номером {{config.phone}}.\n\nСподіваємося побачити вас іншим разом!\n{{config.name}}",
};
