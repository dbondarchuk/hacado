import type { DefaultCSSProperties } from "@hacado/page-builder-base/style";
import type { YouTubeVideoProps } from "./schema";
import type { YouTubeVideoStylesSchema } from "./styles";

export const getDefaults = (
  { props, style }: YouTubeVideoProps,
  isEditor?: boolean,
): DefaultCSSProperties<YouTubeVideoStylesSchema> => ({
  display: "inline-block",
  maxWidth: {
    value: 100,
    unit: "%",
  },
  position: "relative",
  padding: {
    left: {
      value: 0,
      unit: "px",
    },
    right: {
      value: 0,
      unit: "px",
    },
    top: {
      value: 0,
      unit: "px",
    },
    bottom: {
      value: 56.25,
      unit: "%",
    },
  },
});
