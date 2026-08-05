import { TemplatesTemplate } from "@hacado/types";

export const giftCardToCustomerEmailTemplate: TemplatesTemplate = {
  name: "Покупка подарункового сертифіката (клієнту)",
  subject: "Ваш подарунковий сертифікат",
  type: "email",
  value: {
    type: "EmailLayout",
    id: "gift-card-studio-customer-email-layout-uk",
    data: {
      backdropColor: "#F5F5F5",
      borderRadius: 0,
      canvasColor: "#FFFFFF",
      textColor: "#262626",
      fontFamily: "BOOK_SANS",
      maxWidth: 600,
      padding: {
        top: 24,
        bottom: 24,
        left: 16,
        right: 16,
      },
      children: [
        {
          type: "Avatar",
          id: "gift-card-studio-customer-email-logo-uk",
          data: {
            style: {
              textAlign: "center",
              padding: {
                top: 16,
                bottom: 16,
                right: 24,
                left: 24,
              },
            },
            props: {
              size: 80,
              shape: "circle",
              imageUrl: "{{websiteUrl}}{{config.logo}}",
            },
          },
        },
        {
          type: "Heading",
          id: "gift-card-studio-customer-email-business-name-uk",
          data: {
            props: {
              text: "{{config.name}}",
              level: "h3",
            },
            style: {
              textAlign: "center",
              padding: {
                top: 4,
                bottom: 16,
                right: 24,
                left: 24,
              },
            },
          },
        },
        {
          type: "Heading",
          id: "gift-card-studio-customer-email-title-uk",
          data: {
            props: {
              text: "Дякуємо за покупку подарункового сертифіката!",
            },
            style: {
              textAlign: "center",
              padding: {
                top: 8,
                bottom: 8,
                right: 24,
                left: 24,
              },
            },
          },
        },
        {
          type: "Text",
          id: "gift-card-studio-customer-email-body-uk",
          data: {
            style: {
              fontWeight: "normal",
              padding: {
                top: 8,
                bottom: 8,
                right: 24,
                left: 24,
              },
            },
            props: {
              value: [
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-greeting-uk",
                  children: [
                    {
                      text: "Привіт, {{customer.name}},",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-confirmation-uk",
                  children: [
                    {
                      text: "Дякуємо, що придбали подарунковий сертифікат у {{config.name}}.",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-amount-uk",
                  children: [
                    {
                      text: "Сума: {{giftCard.amountPurchasedFormatted}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-code-uk",
                  children: [
                    {
                      text: "Код сертифіката: {{giftCard.giftCardCode}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-note-uk",
                  children: [
                    {
                      text: "Подарунковий сертифікат та рахунок у вкладеннях до цього листа (PDF).",
                      fontSize: "14px",
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          type: "Text",
          id: "gift-card-studio-customer-email-footer-uk",
          data: {
            props: {
              value: [
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-footer-regards-uk",
                  align: "start",
                  children: [
                    {
                      text: "З повагою,",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-footer-business-uk",
                  align: "start",
                  children: [
                    {
                      text: "{{config.name}}",
                      fontSize: "14px",
                    },
                  ],
                },
              ],
            },
            style: {
              padding: {
                top: 8,
                bottom: 16,
                left: 24,
                right: 24,
              },
              fontWeight: "normal",
            },
          },
        },
      ],
    },
  },
};
