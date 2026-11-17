import type { ConditionalContainerProps } from "./schema";

export const ConditionalContainerPropsDefaults = {
  props: {
    condition: "",
    then: { children: [] },
    otherwise: { children: [] },
  },
} as const satisfies ConditionalContainerProps;
