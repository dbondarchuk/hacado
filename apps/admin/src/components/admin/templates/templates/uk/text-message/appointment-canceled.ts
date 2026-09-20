import { TemplatesTemplate } from "@hacado/types";

export const appointmentCanceledTextMessageTemplate: TemplatesTemplate = {
  name: "Скасування запису (текстовий)",
  type: "text-message",
  value:
    "Привіт, {{fields.name}}!\nВаш запис на послугу {{ option.name }} {{dateTime.full}} з {{member.name}}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}} скасовано.\n\nЯкщо хочете обрати інший час, зателефонуйте або напишіть нам за номером {{config.phone}}.\n\n{{config.name}}",
};
