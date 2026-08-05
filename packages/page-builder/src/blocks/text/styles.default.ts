import type {
  AllStylesSchemas,
  DefaultCSSProperties,
} from "@hacado/page-builder-base/style";
import type { TextProps } from "./schema";

export const getDefaults = (
  { props, style }: TextProps,
  isEditor?: boolean,
): DefaultCSSProperties<AllStylesSchemas> => ({
  fontSize: {
    value: 1,
    unit: "rem",
  },
  color: "var(--value-foreground-color)",
  padding: {
    top: {
      value: 0,
      unit: "rem",
    },
    bottom: {
      value: 0,
      unit: "rem",
    },
    left: {
      value: 0,
      unit: "rem",
    },
    right: {
      value: 0,
      unit: "rem",
    },
  },
});
