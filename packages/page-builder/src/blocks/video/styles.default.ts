import type { DefaultCSSProperties } from "@hacado/page-builder-base/style";
import type { VideoProps } from "./schema";
import type { VideoStylesSchema } from "./styles";

export const getDefaults = (
  { props, style }: VideoProps,
  isEditor?: boolean,
): DefaultCSSProperties<VideoStylesSchema> => ({
  display: "inline-block",
  maxWidth: {
    value: 100,
    unit: "%",
  },
});
