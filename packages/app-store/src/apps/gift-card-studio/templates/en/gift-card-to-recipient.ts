import { TemplatesTemplate } from "@hacado/types";

export const giftCardToRecipientEmailTemplate: TemplatesTemplate = {
  name: "Gift card (to recipient)",
  subject: "You've received a gift card",
  type: "email",
  value: {
    type: "EmailLayout",
    id: "gift-card-studio-recipient-email-layout",
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
          id: "gift-card-studio-recipient-email-logo",
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
          id: "gift-card-studio-recipient-email-business-name",
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
          id: "gift-card-studio-recipient-email-title",
          data: {
            props: {
              text: "You've received a gift card!",
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
          id: "gift-card-studio-recipient-email-body",
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
                  id: "gift-card-studio-recipient-email-greeting",
                  children: [
                    {
                      text: "Hi {{giftCard.toName}},",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-from",
                  children: [
                    {
                      text: "{{customer.name}} has purchased a gift card for you at {{config.name}}.",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-amount",
                  children: [
                    {
                      text: "Amount: {{giftCard.amountPurchasedFormatted}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-code",
                  children: [
                    {
                      text: "Gift card code: {{giftCard.giftCardCode}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-message",
                  children: [
                    {
                      text: "Message from sender: {{giftCard.message}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-note",
                  children: [
                    {
                      text: "Your gift card is attached to this email as a PDF file.",
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
          id: "gift-card-studio-recipient-email-footer",
          data: {
            props: {
              value: [
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-footer-regards",
                  align: "start",
                  children: [
                    {
                      text: "We look forward to seeing you soon!",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "gift-card-studio-recipient-email-footer-business",
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
