import { TemplatesTemplate } from "@hacado/types";

export const paymentLinksSmsTemplate: TemplatesTemplate = {
  name: "SMS з посиланням на оплату",
  type: "text-message",
  value:
    "Привіт, {{customer.name}}. {{config.name}} надіслав(ла) запит на оплату {{payment.amountFormatted}}. Оплатити: {{paymentLinkUrl}}",
};
