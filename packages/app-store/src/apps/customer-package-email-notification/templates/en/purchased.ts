import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packagePurchasedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-purchased-email",
    name: "Package purchased",
    subject: "Your package purchase - {{package.name}}",
    previewText: "Your package is ready to use",
    content: [
      {
        type: "title",
        text: "Thank you for your package purchase!",
      },
      {
        type: "text",
        text: "Hi {{customer.name}},\n\nYour package **{{package.name}}** is ready to use. You have **{{package.remainingCredits}}** of **{{package.totalCredits}}** credits remaining.\n\nBest regards,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} credits{{#package.expiresAt}} · expires {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
