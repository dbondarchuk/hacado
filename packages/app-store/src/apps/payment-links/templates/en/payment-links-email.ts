import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const paymentLinksEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "payment-links-email",
    name: "Payment link",
    subject: "Payment request from {{config.name}}",
    content: [
      {
        type: "title",
        text: "You have a payment request",
      },
      {
        type: "text",
        text: `Hi {{customer.name}},

{{config.name}} has sent you a payment request for {{payment.amountFormatted}}.

Use the button below to pay securely.`,
      },
      {
        type: "button",
        button: {
          text: "Pay now",
          url: "{{paymentLinkUrl}}",
        },
      },
      {
        type: "text",
        text: `If the button does not work, copy and paste this link into your browser:
{{paymentLinkUrl}}

Best regards,

{{config.name}}`,
      },
    ],
  });
