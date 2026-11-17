import { EMAIL_BRAND } from "../../brand";
import type { DividerProps } from "./schema";

export const DividerPropsDefaults = {
  props: {
    lineHeight: 1,
    lineColor: EMAIL_BRAND.ink,
  },
  style: { padding: { top: 16, right: 0, bottom: 16, left: 0 } },
} as const satisfies DividerProps;
