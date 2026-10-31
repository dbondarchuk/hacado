import * as z from "zod";
import {
  BaseStyleDictionary,
  StyleDefinition,
  StyleDictionary,
} from "../types";

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

type AnyStyleDefinition = StyleDefinition<z.ZodType<any, any>, string>;

/**
 * Catalog list. Not `as const` — aggregating ~80 style objects into one const
 * tuple made this file's checkExpression cost dominate app-store/services traces.
 */
export const allStyles: readonly AnyStyleDefinition[] = [
  ...backgroundStyles,
  ...borderStyles,
  ...effectsStyles,
  ...layoutStyles,
  ...spacingStyles,
  ...typographyStyles,
  ...miscStyles,
];

type CatalogStyle =
  | (typeof backgroundStyles)[number]
  | (typeof borderStyles)[number]
  | (typeof effectsStyles)[number]
  | (typeof layoutStyles)[number]
  | (typeof spacingStyles)[number]
  | (typeof typographyStyles)[number]
  | (typeof miscStyles)[number];

export type AllStylesNames = CatalogStyle["name"];

export type AllStylesSchemas = {
  [S in CatalogStyle as S["name"]]: S["schema"];
};

export const ALL_STYLES_SCHEMAS = Object.fromEntries(
  allStyles.map((style) => [style.name, style.schema]),
) as AllStylesSchemas;

export const ALL_STYLES = Object.fromEntries(
  allStyles.map((style) => [style.name, style]),
) as StyleDictionary<AllStylesSchemas>;

export type WithStyle<T extends StyleDefinition<any, any>> = StyleDictionary<
  AllStylesSchemas & { [key in T["name"]]: T["schema"] }
>;

export const getAllStylesWithAdditionalStyles = <T extends BaseStyleDictionary>(
  additionalStyles: StyleDictionary<T>,
) => {
  return {
    ...ALL_STYLES,
    ...additionalStyles,
  } as StyleDictionary<AllStylesSchemas & T>;
};
