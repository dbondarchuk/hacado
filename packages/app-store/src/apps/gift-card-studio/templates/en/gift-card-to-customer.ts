import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const giftCardToCustomerEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "gift-card-studio-customer-email",
    name: "Gift card purchase (to buyer)",
    subject: "Your gift card purchase",
    content: [
      {
        type: "title",
        text: "Thank you for your gift card purchase!",
      },
      {
        type: "text",
        text: `Hi {{customer.name}},

Thank you for purchasing a gift card from {{config.name}}.

Amount: {{giftCard.amountPurchasedFormatted}}

Gift card code: {{giftCard.giftCardCode}}

Your gift card and invoice are attached to this email as PDF files.

Best regards,

{{config.name}}`,
      },
    ],
  });
