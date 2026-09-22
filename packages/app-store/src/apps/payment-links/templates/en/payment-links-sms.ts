import { TemplatesTemplate } from "@hacado/types";

export const paymentLinksSmsTemplate: TemplatesTemplate = {
  name: "Payment link SMS",
  type: "text-message",
  value:
    "Hi {{customer.name}}, {{config.name}} sent you a payment request for {{payment.amountFormatted}}. Pay here: {{paymentLinkUrl}}",
};
