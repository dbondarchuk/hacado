import type {
  AllStylesSchemas,
  DefaultCSSProperties,
} from "@hacado/page-builder-base/style";
import type { SpacerProps } from "./schema";

export const getDefaults = (
  { props, style }: SpacerProps,
  isEditor?: boolean,
): DefaultCSSProperties<AllStylesSchemas> => {
  return {
    display: "block",
    height: {
      value: 1,
      unit: "rem",
    },
  };
};
