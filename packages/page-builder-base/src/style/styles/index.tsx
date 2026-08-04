import { BaseStyleDictionary, StyleDictionary } from "../types";

// Import styles by category
import { backgroundStyles } from "./background";
import { borderStyles } from "./border";
import { effectsStyles } from "./effects";
import { layoutStyles } from "./layout";
import { miscStyles } from "./misc";
import { spacingStyles } from "./spacing";
import { typographyStyles } from "./typography";

// Export all style definitions by category
export * from "./background";
export * from "./border";
export * from "./effects";
export * from "./layout";
export * from "./misc";
export * from "./spacing";
export * from "./typography";

// Collect all styles from categories
export const allStyles = [
  // Background styles
  ...backgroundStyles,

  // Border styles
  ...borderStyles,

  // Effects styles
  ...effectsStyles,

  // Layout styles
  ...layoutStyles,

  // Spacing styles
  ...spacingStyles,

  // Typography styles
  ...typographyStyles,

  // Misc styles
  ...miscStyles,
] as const;

export type AllStyles = (typeof allStyles)[number];

export type AllStylesNames = AllStyles["name"];

export type AllStylesSchemas = {
  [S in AllStyles as S["name"]]: S["schema"];
};

export const ALL_STYLES_SCHEMAS = Object.values(allStyles).reduce(
  (map, style) => {
    map[style.name] = style.schema;
    return map;
  },
  {} as any,
) as AllStylesSchemas;

export const ALL_STYLES = Object.values(allStyles).reduce((map, style) => {
  map[style.name] = style;
  return map;
}, {} as any) as StyleDictionary<AllStylesSchemas>;

export const getAllStylesWithAdditionalStyles = <T extends BaseStyleDictionary>(
  additionalStyles: StyleDictionary<T>,
) => {
  return {
    ...ALL_STYLES,
    ...additionalStyles,
  } as StyleDictionary<AllStylesSchemas & T>;
};
