import type { DefaultCSSProperties } from "@hacado/page-builder-base/style";
import type { IconProps } from "./schema";
import type { IconStylesSchema } from "./styles";

export const getDefaults = (
  { props, style }: IconProps,
  isEditor?: boolean,
): DefaultCSSProperties<IconStylesSchema> => {
  return {
    display: "block",
  };
};
