import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packageExhaustedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-exhausted-email",
    name: "Package exhausted",
    subject: "Your package credits are used up - {{package.name}}",
    previewText: "Your package credits are used up",
    content: [
      {
        type: "title",
        text: "Your package credits are used up",
      },
      {
        type: "text",
        text: "Hi {{customer.name}},\n\nYou have used all credits on **{{package.name}}**. Contact us if you would like to purchase another package.\n\nBest regards,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} credits{{#package.expiresAt}} · expires {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
