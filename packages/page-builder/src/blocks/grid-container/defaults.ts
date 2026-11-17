import type { GridContainerProps } from "./schema";

export const GridContainerPropsDefaults = {
  style: {
    padding: [
      {
        value: {
          top: { value: 1, unit: "rem" },
          bottom: { value: 1, unit: "rem" },
          left: { value: 1.5, unit: "rem" },
          right: { value: 1.5, unit: "rem" },
        },
      },
    ],
    display: [
      {
        value: "grid",
      },
    ],
    gridTemplateColumns: [
      {
        value: "repeat(auto-fit, minmax(250px, 1fr))",
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
  props: {
    children: [],
  },
} as const satisfies GridContainerProps;
