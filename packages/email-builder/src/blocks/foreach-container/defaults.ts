import type { ForeachContainerProps } from "./schema";

export const ForeachContainerPropsDefaults = {
  props: {
    value: "",
    children: [],
  },
} as const satisfies ForeachContainerProps;
