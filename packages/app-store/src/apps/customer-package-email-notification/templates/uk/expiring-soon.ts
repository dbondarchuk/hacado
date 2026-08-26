import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packageExpiringSoonEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-expiring-soon-email",
    name: "Пакет скоро закінчиться",
    subject: "Термін дії пакета скоро закінчиться - {{package.name}}",
    previewText: "Термін дії вашого пакета скоро закінчиться",
    content: [
      {
        type: "title",
        text: "Термін дії вашого пакета скоро закінчиться",
      },
      {
        type: "text",
        text: "Вітаємо, {{customer.name}}!\n\nТермін дії пакета **{{package.name}}** закінчується **{{package.expiresAt.full}}**. У вас залишилось **{{package.remainingCredits}}** з **{{package.totalCredits}}** кредитів - забронюйте візит, щоб їх не втратити.\n\nЗ повагою,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} кредитів{{#package.expiresAt}} · діє до {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
