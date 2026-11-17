import type { CustomHTMLProps } from "./schema";

export const CustomHTMLPropsDefaults = {
  props: {
    html: "",
  },
} as const satisfies CustomHTMLProps;
