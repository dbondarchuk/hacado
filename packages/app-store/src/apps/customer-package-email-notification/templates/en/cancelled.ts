import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packageCancelledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-cancelled-email",
    name: "Package cancelled",
    subject: "Your package was cancelled — {{package.name}}",
    previewText: "Your package was cancelled",
    content: [
      {
        type: "title",
        text: "Your package was cancelled",
      },
      {
        type: "text",
        text: "Hi {{customer.name}},\n\nYour package **{{package.name}}** has been cancelled. Please contact us if you have questions.\n\nBest regards,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} credits{{#package.expiresAt}} · expires {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
