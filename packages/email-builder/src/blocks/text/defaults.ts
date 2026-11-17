import type { TextProps } from "./schema";

export const TextPropsDefaults = {
  props: { value: [{ type: "p", children: [{ text: "" }] }] },
  style: {
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
    fontWeight: "normal",
  },
} as const satisfies TextProps;
