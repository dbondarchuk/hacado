import { borderColorStyle } from "./border-color";
import { borderRadiusStyle } from "./border-radius";
import { borderStyleStyle } from "./border-style";
import { borderWidthStyle } from "./border-width";

export * from "./border-color";
export * from "./border-radius";
export * from "./border-style";
export * from "./border-width";

export const borderStyles = [
  borderColorStyle,
  borderRadiusStyle,
  borderStyleStyle,
  borderWidthStyle,
] as const;
