import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import * as z from "zod";
import { InlineContainerPropsDefaults } from "../inline-container/schema";
import { zStyles } from "./styles";

export const AccordionItemPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    title: z.object({
      children: z.array(z.any()).max(1),
    }),
    content: z.object({
      children: z.array(z.any()),
    }),
    isOpen: z.boolean().optional().nullable(),
  }),
});

export type AccordionItemProps = z.infer<typeof AccordionItemPropsSchema>;
export type AccordionItemReaderProps = BaseReaderBlockProps<any> &
  AccordionItemProps;

export const AccordionItemPropsDefaults = () =>
  ({
    props: {
      title: {
        children: [
          {
            type: "InlineContainer",
            id: generateId(),
            data: {
              style: InlineContainerPropsDefaults.style,
              props: {
                children: [
                  {
                    type: "InlineText",
                    id: generateId(),
                    data: {
                      props: {
                        text: "Accordion Item Title",
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      content: {
        children: [
          {
            type: "Container",
            data: {
              props: {
                children: [
                  {
                    type: "Text",
                    data: {
                      props: {
                        value:
                          "Accordion item content goes here. You can add any blocks inside this content area.",
                      },
                      style: {
                        fontFamily: [
                          {
                            value: "PRIMARY",
                          },
                        ],
                        fontSize: [
                          {
                            value: { value: 1, unit: "rem" },
                          },
                        ],
                      },
                    },
                    id: generateId(),
                  },
                ],
              },
              style: {
                display: [
                  {
                    value: "flex",
                  },
                ],
                flexDirection: [
                  {
                    value: "column",
                  },
                ],
                justifyContent: [
                  {
                    value: "flex-start",
                  },
                ],
                alignItems: [
                  {
                    value: "flex-start",
                  },
                ],
              },
              id: generateId(),
            },
            id: generateId(),
          },
        ],
      },
      isOpen: false,
    },
    style: {
      textAlign: [
        {
          value: "left",
        },
      ],
      width: [
        {
          value: {
            value: 100,
            unit: "%",
          },
        },
      ],
      margin: [
        {
          value: {
            left: {
              value: 0,
              unit: "px",
            },
            right: {
              value: 0,
              unit: "px",
            },
            top: {
              value: 0,
              unit: "px",
            },
            bottom: {
              value: 0,
              unit: "px",
            },
          },
        },
      ],
      padding: [
        {
          value: {
            left: {
              value: 0,
              unit: "px",
            },
            right: {
              value: 0,
              unit: "px",
            },
            top: {
              value: 0,
              unit: "px",
            },
            bottom: {
              value: 0,
              unit: "px",
            },
          },
        },
      ],
      display: [
        {
          value: "block",
        },
      ],
    },
  }) satisfies AccordionItemProps;
