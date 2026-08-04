import { backgroundBlendModeStyle } from "./background-blend-mode";
import { backgroundClipStyle } from "./background-clip";
import { backgroundColorStyle } from "./background-color";
import { backgroundColorOpacityStyle } from "./background-color-opacity";
import { backgroundImageStyle } from "./background-image";
import { backgroundPositionStyle } from "./background-position";
import { backgroundRepeatStyle } from "./background-repeat";
import { backgroundSizeStyle } from "./background-size";

export * from "./background-blend-mode";
export * from "./background-clip";
export * from "./background-color";
export * from "./background-color-opacity";
export * from "./background-image";
export * from "./background-position";
export * from "./background-repeat";
export * from "./background-size";

export const backgroundStyles = [
  backgroundBlendModeStyle,
  backgroundClipStyle,
  backgroundColorStyle,
  backgroundColorOpacityStyle,
  backgroundImageStyle,
  backgroundPositionStyle,
  backgroundRepeatStyle,
  backgroundSizeStyle,
] as const;
