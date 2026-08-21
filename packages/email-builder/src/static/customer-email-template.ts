import { TReaderBlock, generateId as generateBlockId } from "@hacado/builder";
import {
  buildEmailContentBlocks,
  type EmailContentBlock,
} from "./content-blocks";

export type CustomerEmailTemplateProps = {
  /** Stable seed for block ids (layout / logo / business name). */
  id: string;
  name: string;
  subject: string;
  previewText?: string;
  content: EmailContentBlock[];
};

export type BuiltCustomerEmailTemplate = {
  name: string;
  subject: string;
  type: "email";
  value: TReaderBlock;
};

/**
 * Builds a customer-facing email template document (structure only — not rendered HTML).
 * Text blocks are stored as Plate markdown. Mustache placeholders are kept as literals.
 */
export function buildCustomerEmailTemplate({
  id,
  name,
  subject,
  previewText,
  content,
}: CustomerEmailTemplateProps): BuiltCustomerEmailTemplate {
  const contentBlocks = buildEmailContentBlocks(content);

  return {
    name,
    subject,
    type: "email",
    value: {
      type: "EmailLayout",
      id: generateBlockId(`${id}-layout`),
      data: {
        backdropColor: "#F5F5F5",
        borderRadius: 0,
        canvasColor: "#FFFFFF",
        textColor: "#262626",
        fontFamily: "BOOK_SANS",
        previewText,
        maxWidth: 600,
        padding: {
          top: 24,
          bottom: 24,
          left: 16,
          right: 16,
        },
        children: [
          {
            type: "ConditionalContainer",
            id: generateBlockId(`${id}-logo-if`),
            data: {
              props: {
                condition: "config.logo",
                then: {
                  children: [
                    {
                      type: "Avatar",
                      id: generateBlockId(`${id}-logo`),
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
                  ],
                },
                otherwise: {
                  children: [],
                },
              },
            },
          },
          {
            type: "Heading",
            id: generateBlockId(`${id}-business-name`),
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
          ...contentBlocks,
          {
            type: "Text",
            id: generateBlockId(`${id}-attribution`),
            data: {
              props: {
                value: [
                  {
                    type: "p",
                    align: "center",
                    children: [
                      {
                        text: `© ${new Date().getFullYear()}`,
                        fontSize: "11px",
                        color: "#999999",
                      },
                      {
                        text: " ",
                      },
                      {
                        type: "a",
                        url: "{{websiteUrl}}",
                        target: "_blank",
                        children: [
                          {
                            text: "{{config.name}}",
                            fontSize: "11px",
                            color: "#999999",
                          },
                        ],
                      },
                      {
                        text: "",
                      },
                    ],
                  },
                  {
                    type: "p",
                    align: "center",
                    children: [
                      {
                        text: "Sent via ",
                        fontSize: "11px",
                        color: "#999999",
                      },
                      {
                        type: "a",
                        url: "https://hacado.com",
                        target: "_blank",
                        children: [
                          {
                            text: "Hacado",
                            fontSize: "11px",
                            color: "#999999",
                          },
                        ],
                      },
                      {
                        text: "",
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
                textAlign: "center",
              },
            },
          },
        ],
      },
    },
  };
}

export { addonsSelectedBlock, businessFooterBlock } from "./content-blocks";
export type { EmailContentBlock };
