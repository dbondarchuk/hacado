import type { SpacerProps } from "./schema";

export const SpacerPropsDefaults = {
  style: {
    height: [
      {
        breakpoint: [],
        state: [],
        value: {
          value: 1,
          unit: "rem",
        },
      },
    ],
    display: [
      {
        breakpoint: [],
        state: [],
        value: "block",
      },
    ],
  },
} as const satisfies SpacerProps;
