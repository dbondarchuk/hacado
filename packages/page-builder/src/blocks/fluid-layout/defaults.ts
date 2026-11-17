import type { FluidLayoutProps } from "./schema";

export const FluidLayoutPropsDefaults = {
  style: {
    padding: [
      {
        value: {
          top: { value: 1.5, unit: "rem" },
          bottom: { value: 1.5, unit: "rem" },
          left: { value: 1.5, unit: "rem" },
          right: { value: 1.5, unit: "rem" },
        },
      },
    ],
    width: [
      {
        value: { value: 100, unit: "%" },
      },
    ],
    minHeight: [
      {
        value: { value: 16, unit: "rem" },
      },
    ],
  },
  props: {
    children: [],
    placements: {},
    placementOverrides: {},
    rowHeight: 24,
    gap: 8,
  },
} as const satisfies FluidLayoutProps;
