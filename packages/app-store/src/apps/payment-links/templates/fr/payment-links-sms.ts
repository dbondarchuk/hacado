import { TemplatesTemplate } from "@hacado/types/templates";

export const paymentLinksSmsTemplate: TemplatesTemplate = {
  name: "SMS de lien de paiement",
  type: "text-message",
  value:
    "Bonjour {{customer.name}}, {{config.name}} vous a envoyé une demande de paiement pour {{payment.amountFormatted}}. Payez ici : {{paymentLinkUrl}}",
};
