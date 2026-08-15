import { TemplatesTemplate } from "@hacado/types";

export const appointmentRescheduledEmailTemplate: TemplatesTemplate = {
  name: "Перенесення запису (email)",
  subject: "Ваш запис було перенесено",
  type: "email",
  value: {
    type: "EmailLayout",
    id: "block-1740257042800",
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
          id: "block-1740257042821",
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
              size: 83,
              shape: "circle",
              imageUrl: "{{websiteUrl}}{{config.logo}}",
            },
          },
        },
        {
          type: "Heading",
          id: "block-1740257133963",
          data: {
            props: {
              text: "{{config.name}}",
              level: "h3",
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
          type: "Heading",
          id: "block-1740076839739",
          data: {
            props: {
              text: "Запис на послугу {{option.name}} було перенесено",
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
          id: "block-1740076857419",
          data: {
            props: {
              value: [
                {
                  children: [
                    {
                      text: "Привіт, {{fields.name}}!",
                      fontSize: "14px",
                    },
                  ],
                  type: "p",
                  id: "q9weWOHL6n",
                },
                {
                  type: "p",
                  id: "sV5hCxdKSo",
                  children: [
                    {
                      text: "Дякуємо, що обрали {{config.name}}!",
                      fontSize: "14px",
                    },
                  ],
                },
                {
                  type: "p",
                  align: "start",
                  children: [
                    {
                      text: "Ваш візит на послугу {{option.name}} з {{member.name}} було перенесено на {{dateTime.full}} з тривалістю: {{#duration.hours}}{{.}} год {{/duration.hours}}{{#duration.minutes}}{{.}} хв{{/duration.minutes}}.",
                      fontSize: "14px",
                    },
                  ],
                  id: "4_g5MvqMhk",
                },
                {
                  children: [
                    {
                      text: "Будь ласка, зателефонуйте нам за номером {{config.phone}} якомога швидше, якщо цей час вам не підходить.",
                      fontSize: "14px",
                    },
                  ],
                  type: "p",
                  id: "hW8R0FHLpE",
                },
                {
                  type: "p",
                  align: "start",
                  children: [
                    {
                      text: "З нетерпінням чекаємо на зустріч!",
                      fontSize: "14px",
                    },
                  ],
                  id: "J8VSfpARyf",
                },
                {
                  type: "p",
                  align: "start",
                  children: [
                    {
                      text: "З повагою,",
                      fontSize: "14px",
                    },
                  ],
                  id: "mm3cqL0LZx",
                },
                {
                  type: "p",
                  align: "start",
                  id: "OHVM-OUpbm",
                  children: [
                    {
                      fontSize: "14px",
                      text: "{{config.name}}",
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
        {
          type: "Text",
          id: "block-1740258119442",
          data: {
            props: {
              value: [
                {
                  children: [
                    {
                      text: "{{config.name}}",
                      fontSize: "11px",
                      color: "#999999",
                    },
                  ],
                  type: "p",
                  id: "_ZckO-whgq",
                  align: "center",
                },
                {
                  type: "p",
                  id: "GgAnNok00v",
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
                  align: "center",
                  children: [
                    {
                      text: "{{config.phone}}",
                      fontSize: "11px",
                      color: "#999999",
                    },
                  ],
                  id: "Nb_oLeI107",
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
