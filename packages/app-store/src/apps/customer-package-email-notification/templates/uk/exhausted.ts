import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packageExhaustedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-exhausted-email",
    name: "Пакет вичерпано",
    subject: "Кредити пакета використано - {{package.name}}",
    previewText: "Кредити пакета використано",
    content: [
      {
        type: "title",
        text: "Кредити пакета використано",
      },
      {
        type: "text",
        text: "Вітаємо, {{customer.name}}!\n\nВи використали всі кредити пакета **{{package.name}}**. Зв’яжіться з нами, якщо хочете придбати новий пакет.\n\nЗ повагою,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} кредитів{{#package.expiresAt}} · діє до {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
