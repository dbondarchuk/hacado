import type { InlineTextProps } from "./schema";

export const InlineTextPropsDefaults = {
  props: {
    text: "Hello friend",
  },
  style: {},
} as const satisfies InlineTextProps;
