import type { IconProps } from "./schema";

export const IconPropsDefaults = {
  props: {
    icon: "star",
  },
  style: {
    display: [
      {
        value: "inline-block",
      },
    ],
    width: [
      {
        value: { value: 1, unit: "rem" },
      },
    ],
    height: [
      {
        value: { value: 1, unit: "rem" },
      },
    ],
    fill: [
      {
        value: "transparent",
      },
    ],
  },
} as const satisfies IconProps;
