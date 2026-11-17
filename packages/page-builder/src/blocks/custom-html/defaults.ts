import type { CustomHTMLProps } from "./schema";

export const CustomHTMLPropsDefaults = {
  props: {
    html: "",
  },
  style: {},
} as const satisfies CustomHTMLProps;
