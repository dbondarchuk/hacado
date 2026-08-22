import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packagePurchasedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-purchased-email",
    name: "Пакет придбано",
    subject: "Ваш пакет придбано — {{package.name}}",
    previewText: "Ваш пакет готовий до використання",
    content: [
      {
        type: "title",
        text: "Дякуємо за придбання пакета!",
      },
      {
        type: "text",
        text: "Вітаємо, {{customer.name}}!\n\nВаш пакет **{{package.name}}** готовий до використання. Залишилось **{{package.remainingCredits}}** з **{{package.totalCredits}}** кредитів.\n\nЗ повагою,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} кредитів{{#package.expiresAt}} · діє до {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
