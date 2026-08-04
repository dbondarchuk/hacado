import { colorStyle } from "./color";
import { fontFamilyStyle } from "./font-family";
import { fontSizeStyle } from "./font-size";
import { fontStyleStyle } from "./font-style";
import { fontWeightStyle } from "./font-weight";
import { letterSpacingStyle } from "./letter-spacing";
import { lineHeightStyle } from "./line-height";
import { overflowWrapStyle } from "./overflow-wrap";
import { textAlignStyle } from "./text-align";
import { textDecorationStyle } from "./text-decoration";
import { textOverflowStyle } from "./text-overflow";
import { textShadowStyle } from "./text-shadow";
import { textTransformStyle } from "./text-transform";
import { whiteSpaceStyle } from "./white-space";
import { wordBreakStyle } from "./word-break";
import { wordSpacingStyle } from "./word-spacing";

export * from "./color";
export * from "./font-family";
export * from "./font-size";
export * from "./font-style";
export * from "./font-weight";
export * from "./letter-spacing";
export * from "./line-height";
export * from "./overflow-wrap";
export * from "./text-align";
export * from "./text-decoration";
export * from "./text-overflow";
export * from "./text-shadow";
export * from "./text-transform";
export * from "./white-space";
export * from "./word-break";
export * from "./word-spacing";

export const typographyStyles = [
  colorStyle,
  fontFamilyStyle,
  fontSizeStyle,
  fontStyleStyle,
  fontWeightStyle,
  letterSpacingStyle,
  lineHeightStyle,
  textAlignStyle,
  textDecorationStyle,
  textOverflowStyle,
  textShadowStyle,
  textTransformStyle,
  whiteSpaceStyle,
  wordBreakStyle,
  overflowWrapStyle,
  wordSpacingStyle,
] as const;
