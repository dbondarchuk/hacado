import type { ForeachContainerProps } from "./schema";

export const ForeachContainerPropsDefaults = {
  props: {
    value: "",
    children: [],
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
    width: [
      {
        value: { value: 100, unit: "%" },
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
} as const satisfies ForeachContainerProps;
