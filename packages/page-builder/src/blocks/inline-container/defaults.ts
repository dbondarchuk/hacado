import type { InlineContainerProps } from "./schema";

export const InlineContainerPropsDefaults = {
  style: {
    padding: [
      {
        value: {
          top: { value: 0, unit: "rem" },
          bottom: { value: 0, unit: "rem" },
          left: { value: 0, unit: "rem" },
          right: { value: 0, unit: "rem" },
        },
      },
    ],
    display: [
      {
        value: "inline-flex",
      },
    ],
    flexDirection: [
      {
        value: "row",
      },
    ],
    alignItems: [
      {
        value: "center",
      },
    ],
    justifyContent: [
      {
        value: "center",
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
    children: [],
  },
} as const satisfies InlineContainerProps;
