import * as z from "zod";
import { zNumberValueWithUnit } from "../../../zod";

// Predefined transform options
export const transformKeys = [
  "none",
  "scale(0.5)",
  "scale(0.75)",
  "scale(1.25)",
  "scale(1.5)",
  "scale(2)",
  "rotate(45deg)",
  "rotate(90deg)",
  "rotate(180deg)",
  "rotate(-45deg)",
  "translateX(10px)",
  "translateY(10px)",
  "translateX(-10px)",
  "translateY(-10px)",
  "skewX(10deg)",
  "skewY(10deg)",
  "skewX(-10deg)",
  "skewY(-10deg)",
  "custom",
] as const;

export const transformKeyMap = {
  none: "none",
  "scale(0.5)": "scale_0_5",
  "scale(0.75)": "scale_0_75",
  "scale(1.25)": "scale_1_25",
  "scale(1.5)": "scale_1_5",
  "scale(2)": "scale_2",
  "rotate(45deg)": "rotate_45deg",
  "rotate(90deg)": "rotate_90deg",
  "rotate(180deg)": "rotate_180deg",
  "rotate(-45deg)": "rotate_minus_45deg",
  "translateX(10px)": "translateX_10px",
  "translateY(10px)": "translateY_10px",
  "translateX(-10px)": "translateX_minus_10px",
  "translateY(-10px)": "translateY_minus_10px",
  "skewX(10deg)": "skewX_10deg",
  "skewY(10deg)": "skewY_10deg",
  "skewX(-10deg)": "skewX_minus_10deg",
  "skewY(-10deg)": "skewY_minus_10deg",
  custom: "custom",
} as const;

// Transform function types
export const transformFunctionKeys = [
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "translateX",
  "translateY",
  "translate",
  "skewX",
  "skewY",
  "skew",
] as const;

export const transformFunctionKeyMap = {
  scale: "scale",
  scaleX: "scaleX",
  scaleY: "scaleY",
  rotate: "rotate",
  translateX: "translateX",
  translateY: "translateY",
  translate: "translate",
  skewX: "skewX",
  skewY: "skewY",
  skew: "skew",
} as const;

export type TransformFunctionKey = (typeof transformFunctionKeys)[number];

/** Functions whose values are length/percentage and support selectable units. */
export const transformFunctionsWithUnits = [
  "translateX",
  "translateY",
  "translate",
] as const satisfies readonly TransformFunctionKey[];

export const isTransformFunctionWithUnits = (
  func: string,
): func is (typeof transformFunctionsWithUnits)[number] =>
  (transformFunctionsWithUnits as readonly string[]).includes(func);

export const getFunctionValueCount = (func: string) => {
  switch (func) {
    case "translate":
    case "skew":
      return 2;
    default:
      return 1;
  }
};

/** Fixed CSS unit suffix for functions that don't use selectable length units. */
export const getFixedFunctionUnit = (func: string) => {
  switch (func) {
    case "rotate":
    case "skewX":
    case "skewY":
    case "skew":
      return "deg";
    default:
      return "";
  }
};

// Transform value schemas - numbers (scale/rotate/skew) or number+unit (translate*)
export const TransformFunctionValueSchema = z.union([
  z.number(),
  zNumberValueWithUnit,
]);

export const TransformValueSchema = z.object({
  function: z.enum(transformFunctionKeys),
  values: z.array(TransformFunctionValueSchema),
});

// Combined transform schema
export const TransformSchema = z.union([
  z.enum(transformKeys),
  z.object({
    functions: z.array(TransformValueSchema),
  }),
]);

export type TransformStyleConfiguration = z.infer<typeof TransformSchema>;
export type TransformValue = z.infer<typeof TransformValueSchema>;
export type TransformFunctionValue = z.infer<
  typeof TransformFunctionValueSchema
>;

export const getDefaultFunctionValues = (
  func: string,
): TransformFunctionValue[] => {
  const count = getFunctionValueCount(func);
  if (isTransformFunctionWithUnits(func)) {
    return Array.from({ length: count }, () => ({
      value: 0,
      unit: "px" as const,
    }));
  }
  if (func.includes("scale")) {
    return Array.from({ length: count }, () => 1);
  }
  return Array.from({ length: count }, () => 0);
};
