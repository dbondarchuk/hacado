import type {
  AllStylesSchemas,
  DefaultCSSProperties,
} from "@hacado/page-builder-base/style";
import type { CustomHTMLProps } from "./schema";

export const getDefaults = (
  { props, style }: CustomHTMLProps,
  isEditor?: boolean,
): DefaultCSSProperties<AllStylesSchemas> => {
  return {
    display: "block",
  };
};
