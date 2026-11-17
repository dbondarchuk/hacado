import type { ContainerProps } from "./schema";

export const ContainerPropsDefaults = {
  style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
  props: {
    children: [],
  },
} as const satisfies ContainerProps;
