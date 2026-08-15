import { TemplatesTemplate } from "@hacado/types";

export const giftCardToRecipientEmailTemplate: TemplatesTemplate = {
  name: "Подарунковий сертифікат (отримувачу)",
  subject: "Ви отримали подарунковий сертифікат",
  type: "email",
  value: {
    type: "EmailLayout",
    id: "gift-card-studio-recipient-email-layout-uk",
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
          id: "gift-card-studio-recipient-email-logo-uk",
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
          id: "gift-card-studio-recipient-email-business-name-uk",
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
          id: "gift-card-studio-recipient-email-title-uk",
          data: {
            props: {
              text: "Ви отримали подарунковий сертифікат!",
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
          id: "gift-card-studio-recipient-email-body-uk",
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
                  id: "gift-card-studio-recipient-email-greeting-uk",
                  children: [
                    {
                      text: "Привіт, {{giftCard.toName}},",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-from-uk",
                  children: [
                    {
                      text: "{{customer.name}} придбав(ла) для вас подарунковий сертифікат у {{config.name}}.",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-amount-uk",
                  children: [
                    {
                      text: "Сума: {{giftCard.amountPurchasedFormatted}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-code-uk",
                  children: [
                    {
                      text: "Код сертифіката: {{giftCard.giftCardCode}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-message-uk",
                  children: [
                    {
                      text: "Повідомлення від відправника: {{giftCard.message}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-note-uk",
                  children: [
                    {
                      text: "Подарунковий сертифікат у вкладенні до цього листа (PDF).",
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
          id: "gift-card-studio-recipient-email-footer-uk",
          data: {
            props: {
              value: [
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-footer-regards-uk",
                  align: "start",
                  children: [
                    {
                      text: "З нетерпінням чекаємо на вашу візит!",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-footer-business-uk",
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
