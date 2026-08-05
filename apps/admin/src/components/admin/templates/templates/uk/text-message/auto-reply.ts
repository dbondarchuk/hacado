import { TemplatesTemplate } from "@hacado/types";

export const autoReplyTextMessageTemplate: TemplatesTemplate = {
  name: "Автоматична відповідь (текстовий)",
  type: "text-message",
  value:
    "Привіт{{#customer.name}} {{.}}{{/customer.name}},\nЦей номер телефону не обслуговується. Будь ласка, надішліть свою відповідь на номер {{config.phone}}.\n\nДякуємо,\n{{config.name}} ",
};
