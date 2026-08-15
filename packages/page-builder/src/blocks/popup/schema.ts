import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import { COLORS } from "@hacado/page-builder-base/style";
import * as z from "zod";
import { ButtonPropsDefaults } from "../button";
import { InlineContainerPropsDefaults } from "../inline-container/schema";
import { zStyles } from "./styles";

export const showPopupType = ["always", "one-time", "on-click"] as const;
export const overlayType = ["blur", "default"] as const;

export const PopupPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    show: z.enum(showPopupType),
    overlay: z.enum(overlayType),
    title: z.object({
      children: z.array(z.any()).max(1),
    }),
    subtitle: z.object({
      children: z.array(z.any()).max(1),
    }),
    content: z.object({
      children: z.array(z.any()),
    }),
    buttons: z.object({
      children: z.array(z.any()).max(1),
    }),
    noClose: z.boolean().optional(),
  }),
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
                    },
                    id: generateId(),
                  },
                ],
              },
              style: {},
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
                    },
                    id: generateId(),
                  },
                ],
              },
              style: {},
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
                        action: "close-current-popup",
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
