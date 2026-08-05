import { deepEqual } from "@hacado/utils";
import { BaseStyleDictionary } from "../style/types";
import { StateWithTarget } from "../style/zod";
import { Shortcut, ShortcutOption } from "./types";

export interface ApplyShortcutOptions {
  styles: any;
  onStylesChange?: (styles: any) => void;
  setData?: (data: any) => void;
  data?: any;
  props?: any;
  onPropsChange?: (props: any) => void;
}

/**
 * Shared utility to apply a shortcut option to styles
 * Supports both direct style updates and data object updates
 *
 * ENHANCED FEATURES:
 * 1. Value Functions in Variants: Supports functions that can update values based on previous variant values
 *    Example: { value: (prev) => prev ? prev + 10 : 100, breakpoint: ["sm"] }
 * 2. Multiple Variants: Supports arrays of variants with different breakpoints and states
 * 3. Smart Updates: Preserves existing variants and only updates matching ones
 * 4. Style Removal: Supports explicitly removing styles by setting them to undefined
 *    Example: { maxWidth: undefined } will remove all maxWidth variants
 * 5. Variant Removal: Supports removing specific variants by setting their value to undefined
 *    Example: { maxWidth: { value: undefined, breakpoint: ["sm"] } } will remove only the sm breakpoint variant
 */
export const applyShortcutOption = <T extends BaseStyleDictionary>(
  option: ShortcutOption<T>,
  options: ApplyShortcutOptions,
) => {
  const { styles, onStylesChange, setData, data, props, onPropsChange } =
    options;
  const newStyles = { ...styles };
  const newProps = props ? { ...props } : undefined;

  // Apply each target style
  Object.keys(option.targetStyles).forEach((styleName: keyof T) => {
    const targetStyle = option.targetStyles[styleName];

    // Handle style removal (explicitly setting to undefined)
    if (targetStyle === undefined) {
      newStyles[styleName] = undefined;
      return;
    }

    if (!targetStyle) return;

    // Check if this is a variant object
    const isVariantObject = (
      targetStyle: any,
    ): targetStyle is {
      value: any;
      breakpoint?: string[];
      state?: StateWithTarget[];
    } => {
      return (
        typeof targetStyle === "object" &&
        "value" in targetStyle &&
        ("breakpoint" in targetStyle || "state" in targetStyle)
      );
    };

    // Check if this is a variants array object
    const isVariantsArrayObject = (targetStyle: any): boolean => {
      return (
        targetStyle &&
        typeof targetStyle === "object" &&
        "variants" in targetStyle &&
        Array.isArray(targetStyle.variants)
      );
    };

    if (isVariantsArrayObject(targetStyle)) {
      // Multiple variants format
      const { variants } = targetStyle;

      // Create or update the style with all variants
      const currentVariants = newStyles[styleName] || [];

      const newVariants = variants
        .map(
          (variant: {
            value: any;
            breakpoint?: string[];
            state?: StateWithTarget[];
          }) => {
            const breakpoint = variant.breakpoint || [];
            const state = variant.state || [];

            // Handle variant removal (value is undefined)
            if (variant.value === undefined) {
              return null; // Mark for removal
            }

            // Find existing variant to get previous value for function calls
            const existingVariant = currentVariants.find(
              (v: any) =>
                deepEqual(v.breakpoint, breakpoint) &&
                deepEqual(v.state, state),
            );

            const previousValue = existingVariant?.value;

            return {
              breakpoint,
              state,
              value:
                typeof variant.value === "function"
                  ? variant.value(previousValue)
                  : variant.value,
            };
          },
        )
        .filter((variant: any): variant is any => variant !== null); // Remove null variants

      newStyles[styleName] = newVariants;
    } else if (isVariantObject(targetStyle)) {
      // Single variant format
      const { value, breakpoint = [], state = [] } = targetStyle;

      // Handle variant removal (value is undefined)
      if (value === undefined) {
        if (newStyles[styleName]) {
          // Remove the specific variant that matches the breakpoint and state
          const filteredVariants = newStyles[styleName].filter(
            (variant: any) =>
              !deepEqual(variant.breakpoint, breakpoint) ||
              !deepEqual(variant.state, state),
          );

          // If no variants remain, remove the entire style property
          if (filteredVariants.length === 0) {
            delete newStyles[styleName];
          } else {
            newStyles[styleName] = filteredVariants;
          }
        }
        return;
      }

      if (newStyles[styleName]) {
        // Check if variant already exists
        const existingVariantIndex = newStyles[styleName]?.findIndex(
          (variant: any) =>
            deepEqual(variant.breakpoint, breakpoint) &&
            deepEqual(variant.state, state),
        );

        if (existingVariantIndex !== undefined && existingVariantIndex >= 0) {
          // Update existing variant
          const updatedVariants = [...(newStyles[styleName] || [])];
          updatedVariants[existingVariantIndex] = {
            ...updatedVariants[existingVariantIndex],
            value:
              typeof value === "function"
                ? value(updatedVariants[existingVariantIndex].value)
                : value,
          };
          newStyles[styleName] = updatedVariants;
        } else {
          // Add new variant
          const newVariant = {
            breakpoint,
            state,
            value: typeof value === "function" ? value() : value,
          };
          newStyles[styleName] = [...(newStyles[styleName] || []), newVariant];
        }
      } else {
        // Create new style with variant
        newStyles[styleName] = [
          {
            breakpoint,
            state,
            value: typeof value === "function" ? value() : value,
          },
        ];
      }
    } else {
      // Old format - apply to base variant only
      const value = targetStyle;

      if (newStyles[styleName]) {
        // Update existing style variants
        const currentVariants = newStyles[styleName];
        if (currentVariants && currentVariants.length > 0) {
          const updatedVariants = currentVariants.map((variant: any) => ({
            ...variant,
            value: typeof value === "function" ? value(variant.value) : value,
          }));
          newStyles[styleName] = updatedVariants;
        } else {
          newStyles[styleName] = [
            {
              breakpoint: [],
              state: [],
              value: typeof value === "function" ? value() : value,
            },
          ];
        }
      } else {
        // Create new style variant
        newStyles[styleName] = [
          {
            breakpoint: [],
            state: [],
            value: typeof value === "function" ? value() : value,
          },
        ];
      }
    }
  });

  // Apply target props if they exist
  if (option.targetProps && newProps) {
    Object.assign(newProps, option.targetProps);
  }

  if (setData && data) {
    const newData = { ...data, style: newStyles };
    if (newProps) {
      newData.props = newProps;
    }
    setData(newData);
  } else {
    // Handle different update patterns
    if (onStylesChange) {
      onStylesChange(newStyles);
    }

    if (onPropsChange && newProps) {
      onPropsChange(newProps);
    }
  }

  return newStyles;
};

/**
 * Shared utility to get the current value for a shortcut
 * Supports both direct styles and data object patterns
 *
 * ENHANCED FEATURES:
 * 1. Best Match Algorithm: Instead of returning the first match, finds the option with the highest score
 * 2. Variant-Aware Matching: Considers all variants when calculating match scores
 * 3. Partial Matching: Provides partial scores for similar values (e.g., numeric values)
 * 4. Smart Scoring: Weights matches based on how many variants align and how closely values match
 *
 * SCORING SYSTEM:
 * - Perfect match: 1.0 (exact value match)
 * - Partial match: 0.3-0.99 (similar values, especially for numbers)
 * - Variant match: Base score + bonus for having more variants (up to 0.5 extra)
 * - Variant bonus: Rewards options with more comprehensive styling
 * - No match: 0.0
 *
 * EXAMPLE: "contained" vs "full" options
 * - Both have same base styles (width: 100%, margin: auto)
 * - "contained" has additional maxWidth variants
 * - When maxWidth variants match current styles, "contained" gets higher score
 * - This ensures "contained" is selected when appropriate
 */
export const getShortcutCurrentValue = <T extends BaseStyleDictionary>(
  shortcut: Shortcut<T>,
  styles: any,
  props?: any,
): string | undefined => {
  if (!styles && !props) return undefined;

  // Handle number-with-unit type separately
  if (shortcut.inputType === "number-with-unit") {
    return undefined; // Number-with-unit doesn't use string values
  }

  // Handle asset-selector type separately
  if (shortcut.inputType === "asset-selector") {
    return undefined; // Asset-selector doesn't use predefined options
  }

  // Handle color type separately
  if (shortcut.inputType === "color") {
    return undefined; // Color doesn't use predefined options
  }

  // Try to find the best matching option for the current styles
  let bestMatch: { option: ShortcutOption<T>; score: number } | null = null;

  for (const option of shortcut.options) {
    let totalScore = 0;
    let totalChecks = 0;

    Object.keys(option.targetStyles).forEach((styleName: keyof T) => {
      const targetValue = option.targetStyles[styleName];
      totalChecks++;

      // Check if this is a variants array object
      const isVariantsArrayObject = (
        targetValue: any,
      ): targetValue is {
        variants: Array<{
          value: any;
          breakpoint?: string[];
          state?: StateWithTarget[];
        }>;
      } => {
        return (
          targetValue &&
          typeof targetValue === "object" &&
          "variants" in targetValue &&
          Array.isArray(targetValue.variants)
        );
      };

      if (isVariantsArrayObject(targetValue)) {
        // For variants array, check how many variants match
        const currentVariants = styles[styleName] || [];
        const targetVariants = targetValue.variants;

        if (currentVariants.length === 0 && targetVariants.length === 0) {
          totalScore += 1; // Perfect match for empty variants
        } else if (currentVariants.length > 0 && targetVariants.length > 0) {
          // Check how many variants match
          let variantMatches = 0;
          let totalPossibleMatches = 0;

          for (const targetVariant of targetVariants) {
            const matchingCurrentVariant = currentVariants.find(
              (cv: any) =>
                deepEqual(cv.breakpoint, targetVariant.breakpoint || []) &&
                deepEqual(cv.state, targetVariant.state || []),
            );

            if (matchingCurrentVariant) {
              totalPossibleMatches++;
              const target =
                typeof targetVariant.value === "function"
                  ? targetVariant.value(matchingCurrentVariant.value)
                  : targetVariant.value;

              if (deepEqual(matchingCurrentVariant.value, target)) {
                variantMatches++;
              }
            }
          }

          // Reward options that have more variants that match current styles
          // This gives higher scores to options like "contained" vs "full"
          if (totalPossibleMatches > 0) {
            const matchRatio = variantMatches / totalPossibleMatches;
            // Bonus for having more variants that match (up to 0.5 extra points)
            const variantBonus = Math.min(
              0.5,
              (variantMatches / targetVariants.length) * 0.5,
            );
            totalScore += matchRatio + variantBonus;
          }
        } else if (targetVariants.length > 0) {
          // Bonus for having variants defined (even if no current variants match)
          // This rewards options that provide more comprehensive styling
          totalScore += 0.3;
        }
      } else {
        // For single value, check base variant
        const currentStyle = styles?.[styleName]?.find(
          (s: any) => !s.breakpoint?.length && !s.state?.length,
        );

        if (!currentStyle) {
          // No current style, but target might be setting a new value
          totalScore += 0.3; // Lower score for potential match
        } else {
          const target =
            typeof targetValue === "function"
              ? targetValue(currentStyle.value)
              : targetValue;

          const currentValue = currentStyle.value;
          if (deepEqual(currentValue, target)) {
            totalScore += 1; // Perfect match
          } else {
            // Check if values are similar (for numeric values, etc.)
            if (
              typeof currentValue === "number" &&
              typeof target === "number"
            ) {
              const diff = Math.abs(currentValue - target);
              const maxValue = Math.max(
                Math.abs(currentValue),
                Math.abs(target),
              );
              if (maxValue > 0) {
                totalScore += Math.max(0, 1 - diff / maxValue); // Partial score based on similarity
              }
            }
          }
        }
      }
    });

    // Consider props matching if props exist and option has targetProps
    if (props && option.targetProps) {
      let propsScore = 0;
      let propsChecks = 0;

      Object.keys(option.targetProps).forEach((propName) => {
        const targetPropValue = option.targetProps![propName];
        const currentPropValue = props[propName];
        propsChecks++;

        if (deepEqual(currentPropValue, targetPropValue)) {
          propsScore += 1; // Perfect match
        } else if (
          currentPropValue === undefined &&
          targetPropValue === false
        ) {
          // Handle boolean props that default to false
          propsScore += 0.8;
        } else if (currentPropValue === undefined && targetPropValue === true) {
          // Handle boolean props that default to true
          propsScore += 0.2;
        }
      });

      // Combine styles and props scores
      const propsAverageScore = propsChecks > 0 ? propsScore / propsChecks : 0;
      const combinedScore =
        totalChecks > 0
          ? (totalScore / totalChecks + propsAverageScore) / 2
          : propsAverageScore;

      // Update best match if this option has a higher score
      if (!bestMatch || combinedScore > bestMatch.score) {
        bestMatch = { option, score: combinedScore };
      }
    } else {
      // Calculate average score for this option (styles only)
      const averageScore = totalChecks > 0 ? totalScore / totalChecks : 0;

      // Update best match if this option has a higher score
      if (!bestMatch || averageScore > bestMatch.score) {
        bestMatch = { option, score: averageScore };
      }
    }
  }

  return bestMatch?.option.value;
};
