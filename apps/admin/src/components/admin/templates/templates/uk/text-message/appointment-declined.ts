import { TemplatesTemplate } from "@hacado/types/templates";

export const appointmentDeclinedTextMessageTemplate: TemplatesTemplate = {
  name: "Відхилення запису (текстовий)",
  type: "text-message",
  value:
    "Привіт, {{fields.name}}!\nВаш запис на послугу {{service.name}} {{dateTime.full}} з {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} було відхилено або скасовано.\n\nЯкщо у вас є запитання, зателефонуйте або напишіть нам за номером {{config.phone}}.\n\nСподіваємося побачити вас іншим разом!\n{{config.name}}",
};
