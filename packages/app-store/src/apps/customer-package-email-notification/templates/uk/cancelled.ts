import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packageCancelledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-cancelled-email",
    name: "Пакет скасовано",
    subject: "Ваш пакет скасовано — {{package.name}}",
    previewText: "Ваш пакет скасовано",
    content: [
      {
        type: "title",
        text: "Ваш пакет скасовано",
      },
      {
        type: "text",
        text: "Вітаємо, {{customer.name}}!\n\nВаш пакет **{{package.name}}** було скасовано. Зв’яжіться з нами, якщо маєте запитання.\n\nЗ повагою,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} кредитів{{#package.expiresAt}} · діє до {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
