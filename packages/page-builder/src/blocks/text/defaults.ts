import type { TextProps } from "./schema";

export const TextPropsDefaults = {
  props: {
    value: [{ type: "p", children: [{ text: "" }] }],
  },
  style: {
    padding: [
      {
        value: {
          top: {
            value: 1,
            unit: "rem",
          },
          bottom: {
            value: 1,
            unit: "rem",
          },
          left: {
            value: 1.5,
            unit: "rem",
          },
          right: {
            value: 1.5,
            unit: "rem",
          },
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
  },
} as const satisfies TextProps;
