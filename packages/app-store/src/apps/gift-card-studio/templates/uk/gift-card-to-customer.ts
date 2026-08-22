import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const giftCardToCustomerEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "gift-card-studio-customer-email",
    name: "Покупка подарункового сертифіката (клієнту)",
    subject: "Ваш подарунковий сертифікат",
    content: [
      {
        type: "title",
        text: "Дякуємо за покупку подарункового сертифіката!",
      },
      {
        type: "text",
        text: `Привіт, {{customer.name}},

Дякуємо, що придбали подарунковий сертифікат у {{config.name}}.

Сума: {{giftCard.amountPurchasedFormatted}}

Код сертифіката: {{giftCard.giftCardCode}}

Подарунковий сертифікат та рахунок у вкладеннях до цього листа (PDF).

З повагою,

{{config.name}}`,
      },
    ],
  });
