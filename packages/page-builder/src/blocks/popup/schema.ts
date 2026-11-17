import { generateId } from "@hacado/builder/helpers";
import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { COLORS } from "@hacado/page-builder-base/style";
import * as z from "zod";
import { ButtonPropsDefaults } from "../button";
import { InlineContainerPropsDefaults } from "../inline-container/schema";
import { zStyles } from "./styles";

export const showPopupType = ["always", "one-time", "on-click"] as const;
export const overlayType = ["blur", "default"] as const;

export const PopupPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      show: z
        .enum(showPopupType)
        .describe("When the popup appears (always, once, or on click)"),
      overlay: z
        .enum(overlayType)
        .describe("Backdrop style behind the modal"),
      title: z
        .object({
          children: z
            .array(z.any())
            .max(1)
            .describe("Single slot for the popup title"),
        })
        .describe("Title region"),
      subtitle: z
        .object({
          children: z
            .array(z.any())
            .max(1)
            .describe("Single slot for the popup subtitle"),
        })
        .describe("Subtitle region"),
      content: z
        .object({
          children: z
            .array(z.any())
            .describe("Main body blocks inside the popup"),
        })
        .describe("Content region"),
      buttons: z
        .object({
          children: z
            .array(z.any())
            .max(1)
            .describe("Single row container for action buttons"),
        })
        .describe("Footer buttons region"),
      noClose: z
        .boolean()
        .optional()
        .describe("Hide the close control when true"),
    })
    .describe("Block configuration props"),
});

export type PopupProps = z.infer<typeof PopupPropsSchema>;
export type PopupReaderProps = BaseReaderBlockProps<any> & PopupProps;

export const PopupPropsDefaults = () =>
  ({
    style: {
      padding: [
        {
          value: {
            top: { value: 1, unit: "rem" },
            right: { value: 1.5, unit: "rem" },
            bottom: { value: 1, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
          },
        },
      ],
      maxWidth: [
        {
          value: {
            value: 30,
            unit: "rem",
          },
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
      backgroundColor: [
        {
          value: COLORS.background.value,
        },
      ],
      borderRadius: [
        {
          value: { value: 0.5, unit: "rem" },
        },
      ],
      gap: [
        {
          value: {
            value: 0.5,
            unit: "rem",
          },
        },
      ],
    },
    props: {
      show: "always",
      overlay: "default",
      title: {
        children: [
          {
            type: "InlineContainer",
            data: {
              props: {
                children: [
                  {
                    type: "InlineText",
                    data: {
                      props: { text: "Popup title" },
                      style: {
                        display: [
                          {
                            value: "inline-block",
                          },
                        ],
                        width: [
                          {
                            value: { value: 100, unit: "%" },
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
                    value: "block",
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
              },
            },
            id: generateId(),
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
                  // {
                  //   type: "Text",
                  //   data: {
                  //     props: {
                  //       value: "Popup content",
                  //     },
                  //     style: {
                  //       fontFamily: [
                  //         {
                  //           value: "PRIMARY",
                  //         },
                  //       ],
                  //       fontSize: [
                  //         {
                  //           value: { value: 0.8, unit: "rem" },
                  //         },
                  //       ],
                  //     },
                  //     id: generateId(),
                  //   },
                  // },
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
      subtitle: {
        children: [
          {
            type: "InlineContainer",
            data: {
              props: {
                children: [
                  {
                    type: "InlineText",
                    data: {
                      props: { text: "Popup subtitle" },
                      style: {
                        display: [
                          {
                            value: "inline-block",
                          },
                        ],
                        width: [
                          {
                            value: { value: 100, unit: "%" },
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
                    value: "block",
                  },
                ],
                width: [
                  {
                    value: { value: 100, unit: "%" },
                  },
                ],
              },
            },
            id: generateId(),
          },
        ],
      },
      buttons: {
        children: [
          {
            type: "Container",
            data: {
              props: {
                children: [
                  {
                    type: "Button",
                    data: {
                      props: {
                        type: "action",
                        action: "close-modal",
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
                                      props: { text: "Close" },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                      style: ButtonPropsDefaults().style,
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
                  {
                    value: "row",
                    breakpoint: ["sm"],
                  },
                ],
                justifyContent: [
                  {
                    value: "center",
                  },
                ],
                alignItems: [
                  {
                    value: "center",
                  },
                ],
                gap: [
                  {
                    value: {
                      value: 1,
                      unit: "rem",
                    },
                  },
                ],
              },
              id: generateId(),
            },
            id: generateId(),
          },
        ],
      },
    },
  }) as const satisfies PopupProps;
