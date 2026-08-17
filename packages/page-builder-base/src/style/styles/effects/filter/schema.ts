import * as z from "zod";
import { zNumberValueWithUnit } from "../../../zod";

// Predefined filter options
export const filterKeys = [
  "none",
  "blur(1px)",
  "blur(2px)",
  "blur(4px)",
  "brightness(0.5)",
  "brightness(0.9)",
  "brightness(1.1)",
  "brightness(1.5)",
  "contrast(0.5)",
  "contrast(1.5)",
  "grayscale(100%)",
  "hue-rotate(90deg)",
  "invert(100%)",
  "saturate(0.5)",
  "saturate(1.5)",
  "sepia(100%)",
  "custom",
] as const;

export const filterKeyMap = {
  none: "none",
  "blur(1px)": "blur_1px",
  "blur(2px)": "blur_2px",
  "blur(4px)": "blur_4px",
  "brightness(0.5)": "brightness_0_5",
  "brightness(0.9)": "brightness_0_9",
  "brightness(1.1)": "brightness_1_1",
  "brightness(1.5)": "brightness_1_5",
  "contrast(0.5)": "contrast_0_5",
  "contrast(1.5)": "contrast_1_5",
  "grayscale(100%)": "grayscale_100",
  "hue-rotate(90deg)": "hue_rotate_90deg",
  "invert(100%)": "invert_100",
  "saturate(0.5)": "saturate_0_5",
  "saturate(1.5)": "saturate_1_5",
  "sepia(100%)": "sepia_100",
  custom: "custom",
} as const;

// Filter function types
export const filterFunctionKeys = [
  "blur",
  "brightness",
  "contrast",
  "grayscale",
  "hue-rotate",
  "invert",
  "opacity",
  "saturate",
  "sepia",
] as const;

export const filterFunctionKeyMap = {
  blur: "blur",
  brightness: "brightness",
  contrast: "contrast",
  grayscale: "grayscale",
  "hue-rotate": "hue_rotate",
  invert: "invert",
  opacity: "opacity",
  saturate: "saturate",
  sepia: "sepia",
} as const;

export type FilterFunctionKey = (typeof filterFunctionKeys)[number];

/** Functions whose values are lengths and support selectable units. */
export const filterFunctionsWithUnits = [
  "blur",
] as const satisfies readonly FilterFunctionKey[];

export const isFilterFunctionWithUnits = (
  func: string,
): func is (typeof filterFunctionsWithUnits)[number] =>
  (filterFunctionsWithUnits as readonly string[]).includes(func);

/** Unitless multiplier functions (number, typically 0–∞ where 1 is identity). */
export const filterFunctionsUnitless = [
  "brightness",
  "contrast",
  "saturate",
] as const satisfies readonly FilterFunctionKey[];

export const isFilterFunctionUnitless = (
  func: string,
): func is (typeof filterFunctionsUnitless)[number] =>
  (filterFunctionsUnitless as readonly string[]).includes(func);

/** Percentage-based amount functions. */
export const filterFunctionsPercentage = [
  "grayscale",
  "invert",
  "opacity",
  "sepia",
] as const satisfies readonly FilterFunctionKey[];

export const isFilterFunctionPercentage = (
  func: string,
): func is (typeof filterFunctionsPercentage)[number] =>
  (filterFunctionsPercentage as readonly string[]).includes(func);

/** Fixed CSS unit suffix for functions that don't use selectable length units. */
export const getFixedFunctionUnit = (func: string) => {
  switch (func) {
    case "hue-rotate":
      return "deg";
    case "grayscale":
    case "invert":
    case "opacity":
    case "sepia":
      return "%";
    default:
      return "";
  }
};

// Filter value schemas - numbers or number+unit (blur)
export const FilterFunctionValueSchema = z.union([
  z.number(),
  zNumberValueWithUnit,
]);

export const FilterValueSchema = z.object({
  function: z.enum(filterFunctionKeys),
  values: z.array(FilterFunctionValueSchema),
});

// Combined filter schema
export const FilterSchema = z.union([
  z.enum(filterKeys),
  z.object({
    functions: z.array(FilterValueSchema),
  }),
]);

export type FilterStyleConfiguration = z.infer<typeof FilterSchema>;
export type FilterValue = z.infer<typeof FilterValueSchema>;
export type FilterFunctionValue = z.infer<typeof FilterFunctionValueSchema>;

export const getDefaultFunctionValues = (
  func: string,
): FilterFunctionValue[] => {
  if (isFilterFunctionWithUnits(func)) {
    return [{ value: 4, unit: "px" as const }];
  }
  if (isFilterFunctionUnitless(func)) {
    return [1];
  }
  if (isFilterFunctionPercentage(func)) {
    return [100];
  }
  if (func === "hue-rotate") {
    return [0];
  }
  return [0];
};
