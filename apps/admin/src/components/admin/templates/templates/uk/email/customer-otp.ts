import { TemplatesTemplate } from "@hacado/types";

export const customerOtpEmailTemplate: TemplatesTemplate = {
  name: "OTP лист для клієнта",
  subject: "Ваш код підтвердження",
  type: "email",
  value: {
    type: "EmailLayout",
    id: "customer-otp-email-uk-layout",
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
          id: "customer-otp-email-uk-logo",
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
          id: "customer-otp-email-uk-business-name",
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
          id: "customer-otp-email-uk-title",
          data: {
            props: {
              text: "Ваш код підтвердження",
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
          id: "customer-otp-email-uk-body",
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
                  id: "customer-otp-email-uk-greeting",
                  children: [
                    {
                      text: "Вітаємо, {{customer.name}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "customer-otp-email-uk-intro",
                  children: [
                    {
                      text: "Використайте код нижче для входу до {{config.name}}.",
                      fontSize: "14px",
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          type: "Heading",
          id: "customer-otp-email-uk-otp-code",
          data: {
            props: {
              text: "{{otp}}",
            },
            style: {
              textAlign: "center",
              padding: {
                top: 16,
                bottom: 16,
                right: 24,
                left: 24,
              },
            },
          },
        },
        {
          type: "Text",
          id: "customer-otp-email-uk-notice",
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
                  id: "customer-otp-email-uk-validity",
                  align: "center",
                  children: [
                    {
                      text: "Код дійсний протягом 5 хвилин.",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "customer-otp-email-uk-security",
                  align: "center",
                  children: [
                    {
                      text: "Якщо ви не запитували цей код, проігноруйте цей лист.",
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
          id: "customer-otp-email-uk-footer",
          data: {
            props: {
              value: [
                {
                  type: "p",
                  id: "customer-otp-email-uk-footer-regards",
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
                  id: "customer-otp-email-uk-footer-business",
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
        {
          type: "Text",
          id: "customer-otp-email-uk-business-info",
          data: {
            props: {
              value: [
                {
                  type: "p",
                  id: "customer-otp-email-uk-info-name",
                  align: "center",
                  children: [
                    {
                      text: "{{config.name}}",
                      fontSize: "11px",
                      color: "#999999",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "customer-otp-email-uk-info-address",
                  align: "center",
                  children: [
                    {
                      text: "{{config.address}}",
                      fontSize: "11px",
                      color: "#999999",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "customer-otp-email-uk-info-phone",
                  align: "center",
                  children: [
                    {
                      text: "{{config.phone}}",
                      fontSize: "11px",
                      color: "#999999",
                    },
                  ],
                },
              ],
            },
            style: {
              padding: {
                top: 16,
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
