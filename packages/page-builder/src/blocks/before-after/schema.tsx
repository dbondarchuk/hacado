import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import { COLORS } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { ImagePropsDefaults } from "../image/schema";
import { InlineContainerPropsDefaults } from "../inline-container/schema";
import { zStyles } from "./styles";

export const BeforeAfterPropsSchema = z.object({
  style: zStyles.optional().nullable(),
  props: z
    .object({
      before: z.object({
        children: z.array(z.any()).length(1),
      }),
      after: z.object({
        children: z.array(z.any()).length(1),
      }),
      beforeLabel: z.object({
        children: z.array(z.any()).length(1),
      }),
      afterLabel: z.object({
        children: z.array(z.any()).length(1),
      }),
      sliderPosition: z.number().min(0).max(100).default(50),
      showLabels: z.boolean().default(true),
      orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
    })
    .optional()
    .nullable(),
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
