import { TemplatesTemplate } from "@hacado/types";

export const paymentLinksSmsTemplate: TemplatesTemplate = {
  name: "SMS de enlace de pago",
  type: "text-message",
  value:
    "Hola {{customer.name}}, {{config.name}} te envió una solicitud de pago por {{payment.amountFormatted}}. Paga aquí: {{paymentLinkUrl}}",
};
