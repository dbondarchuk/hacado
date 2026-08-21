import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const giftCardToRecipientEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "gift-card-studio-recipient-email",
    name: "Gift card (to recipient)",
    subject: "You've received a gift card",
    content: [
      {
        type: "title",
        text: "You've received a gift card!",
      },
      {
        type: "text",
        text: `Hi {{giftCard.toName}},

{{customer.name}} has purchased a gift card for you at {{config.name}}.

Amount: {{giftCard.amountPurchasedFormatted}}

Gift card code: {{giftCard.giftCardCode}}

Message from sender: {{giftCard.message}}

Your gift card is attached to this email as a PDF file.

We look forward to seeing you soon!

{{config.name}}`,
      },
    ],
  });
