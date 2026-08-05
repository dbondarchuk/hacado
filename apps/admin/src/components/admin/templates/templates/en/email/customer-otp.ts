import { TemplatesTemplate } from "@hacado/types";

export const customerOtpEmailTemplate: TemplatesTemplate = {
  name: "Customer OTP Email",
  subject: "Your verification code",
  type: "email",
  value: {
    type: "EmailLayout",
    id: "customer-otp-email-en-layout",
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
          id: "customer-otp-email-en-logo",
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
          id: "customer-otp-email-en-business-name",
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
          id: "customer-otp-email-en-title",
          data: {
            props: {
              text: "Your verification code",
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
          id: "customer-otp-email-en-body",
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
                  id: "customer-otp-email-en-greeting",
                  children: [
                    {
                      text: "Hello, {{customer.name}}",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "customer-otp-email-en-intro",
                  children: [
                    {
                      text: "Use the code below to sign in to {{config.name}}.",
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
          id: "customer-otp-email-en-otp-code",
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
          id: "customer-otp-email-en-notice",
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
                  id: "customer-otp-email-en-validity",
                  align: "center",
                  children: [
                    {
                      text: "This code is valid for 5 minutes.",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  id: "customer-otp-email-en-security",
                  align: "center",
                  children: [
                    {
                      text: "If you did not request this code, please ignore this email.",
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
          id: "customer-otp-email-en-footer",
          data: {
            props: {
              value: [
                {
                  type: "p",
                  id: "customer-otp-email-en-footer-regards",
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
                  id: "customer-otp-email-en-footer-business",
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
          id: "customer-otp-email-en-business-info",
          data: {
            props: {
              value: [
                {
                  type: "p",
                  id: "customer-otp-email-en-info-name",
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
                  id: "customer-otp-email-en-info-address",
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
                  id: "customer-otp-email-en-info-phone",
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
