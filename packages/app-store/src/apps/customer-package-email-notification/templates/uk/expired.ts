import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packageExpiredEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-expired-email",
    name: "Пакет прострочено",
    subject: "Термін дії пакета закінчився — {{package.name}}",
    previewText: "Термін дії пакета закінчився",
    content: [
      {
        type: "title",
        text: "Термін дії пакета закінчився",
      },
      {
        type: "text",
        text: "Вітаємо, {{customer.name}}!\n\nТермін дії пакета **{{package.name}}** закінчився. Невикористані кредити більше недоступні.\n\nЗ повагою,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} кредитів{{#package.expiresAt}} · діє до {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
