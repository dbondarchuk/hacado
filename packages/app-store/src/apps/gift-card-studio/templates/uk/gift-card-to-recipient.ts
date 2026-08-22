import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const giftCardToRecipientEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "gift-card-studio-recipient-email",
    name: "Подарунковий сертифікат (отримувачу)",
    subject: "Ви отримали подарунковий сертифікат",
    content: [
      {
        type: "title",
        text: "Ви отримали подарунковий сертифікат!",
      },
      {
        type: "text",
        text: `Привіт, {{giftCard.toName}},

{{customer.name}} придбав(ла) для вас подарунковий сертифікат у {{config.name}}.

Сума: {{giftCard.amountPurchasedFormatted}}

Код сертифіката: {{giftCard.giftCardCode}}

Повідомлення від відправника: {{giftCard.message}}

Подарунковий сертифікат у вкладенні до цього листа (PDF).

З нетерпінням чекаємо на вашу візит!

{{config.name}}`,
      },
    ],
  });
