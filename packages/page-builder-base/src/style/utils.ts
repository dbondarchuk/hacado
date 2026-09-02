import * as z from "zod";
import { ALL_STYLES, allStyles, AllStylesNames } from "./styles";
import {
  BaseStyleDictionary,
  StyleDefinition,
  StyleDictionary,
  StyleSupport,
} from "./types";
import {
  AllOrPerCorner,
  AllOrPerSide,
  FourSideValues,
  isPerCornerValue,
  isPerSideValue,
  NumberValueWithUnit,
  NumberValueWithUnitOrKeyword,
  NumberValueWithUnitOrUnitless,
  PerCornerKey,
  perCornerKeys,
  PerSideKey,
  perSideKeys,
  zBreakpoint,
  zStateWithTarget,
} from "./zod";

// Helper function to check if a style is allowed for a block
export function isStyleAllowed(
  styleName: AllStylesNames,
  support?: StyleSupport,
): boolean {
  if (!support) return true;

  if (support.blockedStyles?.includes(styleName)) {
    return false;
  }

  if (support.allowedStyles && support.allowedStyles.length > 0) {
    return support.allowedStyles.includes(styleName);
  }

  return true;
}

export function filterStyleDefinitions<
  T extends StyleSupport,
  FinalKeys extends AllStylesNames = T["allowedStyles"] extends AllStylesNames[]
    ? Exclude<
        T["allowedStyles"][number],
        T["blockedStyles"] extends AllStylesNames[]
          ? T["blockedStyles"][number]
          : never
      >
    : Exclude<
        AllStylesNames,
        T["blockedStyles"] extends AllStylesNames[]
          ? T["blockedStyles"][number]
          : never
      >,
>(support: T): Pick<typeof ALL_STYLES, FinalKeys> {
  let keys: AllStylesNames[] = allStyles.map((s) => s.name as AllStylesNames);

  if (support.allowedStyles) {
    keys = keys.filter((k) => support.allowedStyles!.includes(k));
  }

  if (support.blockedStyles) {
    keys = keys.filter((k) => !support.blockedStyles!.includes(k));
  }

  const result = Object.fromEntries(
    keys.map(
      (k) =>
        [k, allStyles.find((s) => s.name === k)!] as [
          AllStylesNames,
          StyleDefinition<any>,
        ],
    ),
  ) as Pick<typeof ALL_STYLES, FinalKeys>;

  return result;
}

// Main function to build styles schema
export function getStylesSchema<T extends BaseStyleDictionary>(
  styleDefinitions: StyleDictionary<T>,
) {
  const baseSchema = Object.values(styleDefinitions).reduce((map, style) => {
    // map[style.name] = z.object({
    //   value: style.schema.optional().nullable(),
    //   variants: z.array(
    //     z.object({
    //       value: style.schema,
    //       breakpoint: zBreakpoint.optional().nullable(),
    //       state: zState.optional().nullable(),
    //     })
    //   ),
    // });
    map[style.name] = z
      .array(
        z.object({
          value: style.schema,
          breakpoint: z.array(zBreakpoint).optional().nullable(),
          state: z.array(zStateWithTarget).optional().nullable(),
        }),
      )
      .optional()
      .nullable();

    return map;
  }, {}) as {
    [key in keyof T]: z.ZodOptional<
      z.ZodNullable<
        z.ZodArray<
          z.ZodObject<{
            breakpoint: z.ZodOptional<
              z.ZodNullable<z.ZodArray<typeof zBreakpoint>>
            >;
            state: z.ZodOptional<
              z.ZodNullable<z.ZodArray<typeof zStateWithTarget>>
            >;
            value: T[key];
          }>
        >
      >
    >;
  };

  return z.object(baseSchema).optional().nullable();
}

export const renderRawNumberWithUnitCss = (
  value: NumberValueWithUnit | NumberValueWithUnitOrUnitless,
) => {
  if (!value) return null;
  return `${value.value}${value.unit}`;
};
export const renderRawNumberWithUnitOrKeywordCss = <T extends string>(
  value: NumberValueWithUnitOrKeyword<T> | null | undefined,
): string => {
  if (value === null || typeof value === "undefined") {
    return "inherit";
  }

  if (typeof value === "object" && value !== null) {
    return renderRawNumberWithUnitCss(value) ?? "inherit";
  }

  return value;
};

export const renderFourSideValuesCss = (
  value: FourSideValues,
  prefix?: string,
) => {
  return Object.entries(value)
    .filter(([_, val]) => !!val)
    .map(([key, val]) => {
      return `${prefix ? `${prefix}-` : ""}${key}: ${renderRawNumberWithUnitOrKeywordCss(val)};`;
    })
    .join("\n");
};

const cornerToCss: Record<PerCornerKey, string> = {
  topLeft: "top-left",
  topRight: "top-right",
  bottomRight: "bottom-right",
  bottomLeft: "bottom-left",
};

const defaultSideLonghand = (shorthand: string, side: PerSideKey) => {
  const separator = shorthand.lastIndexOf("-");
  if (separator === -1) {
    return `${shorthand}-${side}`;
  }
  return `${shorthand.slice(0, separator)}-${side}${shorthand.slice(separator)}`;
};

export const renderAllOrPerSideCss = <T>(
  value: AllOrPerSide<T> | null | undefined,
  shorthand: string,
  renderValue: (v: T) => string | null | undefined,
  longhand: (side: PerSideKey) => string = (side) =>
    defaultSideLonghand(shorthand, side),
): string | null => {
  if (value == null) return null;

  if (!isPerSideValue(value)) {
    const css = renderValue(value);
    if (!css) return null;
    return `${shorthand}: ${css};`;
  }

  const lines = perSideKeys.flatMap((side) => {
    const slot = value[side];
    if (slot == null) return [];
    const css = renderValue(slot);
    if (!css) return [];
    return [`${longhand(side)}: ${css};`];
  });

  return lines.length ? lines.join("\n") : null;
};

export const renderAllOrPerCornerCss = <T>(
  value: AllOrPerCorner<T> | null | undefined,
  shorthand: string,
  renderValue: (v: T) => string | null | undefined,
  longhand: (corner: PerCornerKey) => string = (corner) =>
    `border-${cornerToCss[corner]}-radius`,
): string | null => {
  if (value == null) return null;

  if (!isPerCornerValue(value)) {
    const css = renderValue(value);
    if (!css) return null;
    return `${shorthand}: ${css};`;
  }

  const lines = perCornerKeys.flatMap((corner) => {
    const slot = value[corner];
    if (slot == null) return [];
    const css = renderValue(slot);
    if (!css) return [];
    return [`${longhand(corner)}: ${css};`];
  });

  return lines.length ? lines.join("\n") : null;
};
