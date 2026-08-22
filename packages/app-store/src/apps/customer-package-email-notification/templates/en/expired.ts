import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const packageExpiredEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-package-expired-email",
    name: "Package expired",
    subject: "Your package has expired — {{package.name}}",
    previewText: "Your package has expired",
    content: [
      {
        type: "title",
        text: "Your package has expired",
      },
      {
        type: "text",
        text: "Hi {{customer.name}},\n\nYour package **{{package.name}}** has expired. Remaining unused credits are no longer available.\n\nBest regards,\n\n{{config.name}}",
      },
      {
        type: "text",
        text: "{{package.name}} · {{package.remainingCredits}} / {{package.totalCredits}} credits{{#package.expiresAt}} · expires {{package.expiresAt.full}}{{/package.expiresAt}}",
      },
    ],
  });
