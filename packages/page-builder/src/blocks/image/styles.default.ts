import type { DefaultCSSProperties } from "@hacado/page-builder-base/style";
import type { ImageProps } from "./schema";
import type { ImageStylesSchema } from "./styles";

export const getDefaults = (
  { props, style }: ImageProps,
  isEditor?: boolean,
): DefaultCSSProperties<ImageStylesSchema> => ({
  display: "inline-block",
  textDecoration: "none",
  objectFit: "cover",
  objectPosition: { x: 50, y: 50 },
  verticalAlign: "middle",
  maxWidth: {
    value: 100,
    unit: "%",
  },
});
