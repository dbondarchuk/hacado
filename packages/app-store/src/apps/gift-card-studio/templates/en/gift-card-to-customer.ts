import { TemplatesTemplate } from "@hacado/types";

export const giftCardToCustomerEmailTemplate: TemplatesTemplate = {
  name: "Gift card purchase (to buyer)",
  subject: "Your gift card purchase",
  type: "email",
  value: {
    type: "EmailLayout",
    id: "gift-card-studio-customer-email-layout",
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
          id: "gift-card-studio-customer-email-logo",
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
          id: "gift-card-studio-customer-email-business-name",
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
          id: "gift-card-studio-customer-email-title",
          data: {
            props: {
              text: "Thank you for your gift card purchase!",
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
          id: "gift-card-studio-customer-email-body",
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
                  id: "gift-card-studio-customer-email-greeting",
                  children: [
                    {
                      text: "Hi {{customer.name}},",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-confirmation",
                  children: [
                    {
                      text: "Thank you for purchasing a gift card from {{config.name}}.",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-amount",
                  children: [
                    {
                      text: "Amount: {{giftCard.amountPurchasedFormatted}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-code",
                  children: [
                    {
                      text: "Gift card code: {{giftCard.giftCardCode}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-note",
                  children: [
                    {
                      text: "Your gift card and invoice are attached to this email as PDF files.",
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
          id: "gift-card-studio-customer-email-footer",
          data: {
            props: {
              value: [
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-footer-regards",
                  align: "start",
                  children: [
                    {
                      text: "Best regards,",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-customer-email-footer-business",
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
