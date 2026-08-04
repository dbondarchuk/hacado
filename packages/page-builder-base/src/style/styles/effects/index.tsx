import { animationStyle } from "./animation";
import { backdropFilterStyle } from "./backdrop-filter";
import { boxShadowStyle } from "./box-shadow";
import { cursorStyle } from "./cursor";
import { filterStyle } from "./filter";
import { hideStyle } from "./hide";
import { opacityStyle } from "./opacity";
import { overflowStyle } from "./overflow";
import { pointerEventsStyle } from "./pointer-events";
import { transformStyle } from "./transform";
import { transformOriginStyle } from "./transform-origin";
import { transitionStyle } from "./transition";
import { userSelectStyle } from "./user-select";
import { zIndexStyle } from "./z-index";
import { zoomStyle } from "./zoom";

export * from "./animation";
export * from "./backdrop-filter";
export * from "./box-shadow";
export * from "./cursor";
export * from "./filter";
export * from "./hide";
export * from "./opacity";
export * from "./overflow";
export * from "./pointer-events";
export * from "./transform";
export * from "./transform-origin";
export * from "./transition";
export * from "./user-select";
export * from "./z-index";
export * from "./zoom";

export const effectsStyles = [
  animationStyle,
  backdropFilterStyle,
  boxShadowStyle,
  cursorStyle,
  hideStyle,
  opacityStyle,
  overflowStyle,
  pointerEventsStyle,
  userSelectStyle,
  zIndexStyle,
  transformStyle,
  transformOriginStyle,
  transitionStyle,
  filterStyle,
  zoomStyle,
] as const;
