import { generateId } from "@hacado/builder/helpers";
import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { COLORS } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { ImagePropsDefaults } from "../image/schema";
import { InlineContainerPropsDefaults } from "../inline-container/schema";
import { zStyles } from "./styles";

export const BeforeAfterPropsSchema = z.object({
  style: zStyles
    .optional()
    .nullable()
    .describe(
      "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
    ),
  props: z
    .object({
      before: z
        .object({
          children: z
            .array(z.any())
            .length(1)
            .describe("Single Image block for the before side."),
        })
        .describe("Before image slot on the left or top."),
      after: z
        .object({
          children: z
            .array(z.any())
            .length(1)
            .describe("Single Image block for the after side."),
        })
        .describe("After image slot on the right or bottom."),
      beforeLabel: z
        .object({
          children: z
            .array(z.any())
            .length(1)
            .describe("Single block for the before caption overlay."),
        })
        .describe("Label overlay on the before side."),
      afterLabel: z
        .object({
          children: z
            .array(z.any())
            .length(1)
            .describe("Single block for the after caption overlay."),
        })
        .describe("Label overlay on the after side."),
      sliderPosition: z
        .number()
        .min(0)
        .max(100)
        .default(50)
        .describe("Initial divider position as a percentage (0-100)."),
      showLabels: z
        .boolean()
        .default(true)
        .describe("Show the before and after label overlays."),
      orientation: z
        .enum(["horizontal", "vertical"])
        .default("horizontal")
        .describe("Drag direction of the comparison divider."),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
});

export type BeforeAfterProps = Prettify<z.infer<typeof BeforeAfterPropsSchema>>;
export type BeforeAfterReaderProps = BaseReaderBlockProps<any> &
  BeforeAfterProps;

export const BeforeAfterPropsDefaults = () =>
  ({
    props: {
      before: {
        children: [
          {
            type: "Container",
            id: generateId(),
            data: {
              style: {
                width: [
                  {
                    value: {
                      value: 100,
                      unit: "%",
                    },
                  },
                ],
                height: [
                  {
                    value: {
                      value: 100,
                      unit: "%",
                    },
                  },
                ],
              },
              props: {
                children: [
                  {
                    type: "Image",
                    id: generateId(),
                    data: {
                      ...ImagePropsDefaults,
                      style: {
                        ...ImagePropsDefaults.style,
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
                        height: [
                          {
                            value: {
                              value: 100,
                              unit: "%",
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      after: {
        children: [
          {
            type: "Container",
            id: generateId(),
            data: {
              style: {
                width: [
                  {
                    value: {
                      value: 100,
                      unit: "%",
                    },
                  },
                ],
                height: [
                  {
                    value: {
                      value: 100,
                      unit: "%",
                    },
                  },
                ],
              },
              props: {
                children: [
                  {
                    type: "Image",
                    id: generateId(),
                    data: {
                      ...ImagePropsDefaults,
                      style: {
                        ...ImagePropsDefaults.style,
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
                        height: [
                          {
                            value: {
                              value: 100,
                              unit: "%",
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      sliderPosition: 50,
      showLabels: true,
      beforeLabel: {
        children: [
          {
            type: "InlineContainer",
            id: generateId(),
            data: {
              style: {
                ...InlineContainerPropsDefaults.style,
                position: [
                  {
                    value: "absolute",
                  },
                ],
                backgroundColor: [
                  {
                    value: COLORS["primary"].value,
                  },
                ],
                color: [
                  {
                    value: COLORS["primary-foreground"].value,
                  },
                ],
                backgroundColorOpacity: [
                  {
                    value: 50,
                  },
                ],
                padding: [
                  {
                    value: {
                      top: { value: 0.25, unit: "rem" },
                      bottom: { value: 0.25, unit: "rem" },
                      left: { value: 0.75, unit: "rem" },
                      right: { value: 0.75, unit: "rem" },
                    },
                  },
                ],
                borderRadius: [
                  {
                    value: {
                      value: 0.5,
                      unit: "rem",
                    },
                  },
                ],
                fontSize: [
                  {
                    value: {
                      value: 1,
                      unit: "rem",
                    },
                  },
                ],
                inset: [
                  {
                    value: {
                      left: { value: 1, unit: "rem" },
                      top: { value: 1, unit: "rem" },
                      bottom: null,
                      right: null,
                    },
                  },
                ],
              },
              props: {
                children: [
                  {
                    type: "InlineText",
                    id: generateId(),
                    data: {
                      props: {
                        text: "Before",
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      afterLabel: {
        children: [
          {
            type: "InlineContainer",
            id: generateId(),
            data: {
              style: {
                ...InlineContainerPropsDefaults.style,
                position: [
                  {
                    value: "absolute",
                  },
                ],
                backgroundColor: [
                  {
                    value: COLORS["primary"].value,
                  },
                ],
                color: [
                  {
                    value: COLORS["primary-foreground"].value,
                  },
                ],
                backgroundColorOpacity: [
                  {
                    value: 50,
                  },
                ],
                padding: [
                  {
                    value: {
                      top: { value: 0.25, unit: "rem" },
                      bottom: { value: 0.25, unit: "rem" },
                      left: { value: 0.75, unit: "rem" },
                      right: { value: 0.75, unit: "rem" },
                    },
                  },
                ],
                borderRadius: [
                  {
                    value: {
                      value: 0.5,
                      unit: "rem",
                    },
                  },
                ],
                fontSize: [
                  {
                    value: {
                      value: 1,
                      unit: "rem",
                    },
                  },
                ],
                inset: [
                  {
                    value: {
                      top: { value: 1, unit: "rem" },
                      right: { value: 1, unit: "rem" },
                      left: null,
                      bottom: null,
                    },
                  },
                ],
              },
              props: {
                children: [
                  {
                    type: "InlineText",
                    id: generateId(),
                    data: {
                      props: {
                        text: "After",
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      orientation: "horizontal",
    },
    style: {
      width: [
        {
          value: {
            value: 100,
            unit: "%",
          },
        },
      ],
      aspectRatio: [
        {
          value: {
            x: 16,
            y: 9,
          },
        },
      ],
      overflow: [
        {
          value: "hidden",
        },
      ],
    },
  }) satisfies BeforeAfterProps;
