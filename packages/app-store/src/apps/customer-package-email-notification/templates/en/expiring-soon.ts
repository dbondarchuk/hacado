import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packageExpiringSoonEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-expiring-soon-email",
    name: "Package expiring soon",
    subject: "Your package expires soon — {{package.name}}",
    previewText: "Your package is expiring soon",
    content: [
      {
        type: "title",
        text: "Your package is expiring soon",
      },
      {
        type: "text",
        text: "Hi {{customer.name}},\n\nYour package **{{package.name}}** expires on **{{package.expiresAt.full}}**. You still have **{{package.remainingCredits}}** of **{{package.totalCredits}}** credits left — book soon so they do not go unused.\n\nBest regards,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} credits{{#package.expiresAt}} · expires {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
