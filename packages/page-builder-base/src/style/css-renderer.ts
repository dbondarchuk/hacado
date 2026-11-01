import { backgroundColorOpacityStyle } from "./styles";
import { BaseStyleDictionary, BlockStyles, StyleDictionary } from "./types";
import { StateWithTarget, generateStateTargetSelector } from "./zod";

export type StyleValue<T extends BaseStyleDictionary = BaseStyleDictionary> =
  BlockStyles<T>;

export type DefaultCSSProperties<
  T extends BaseStyleDictionary = BaseStyleDictionary,
> = {
  [K in keyof T]?: unknown;
};

// Helper to render a style object to CSS string (for direct styles only)
function renderDirectStylesToCSS<T extends BaseStyleDictionary>(
  styleDefinitions: StyleDictionary<T>,
  styles?: StyleValue<T> | null,
  defaultProperties?: DefaultCSSProperties<T> | null,
  isEditor?: boolean,
): string {
  let css = "";

  css += backgroundColorOpacityStyle.renderToCSS(100) + "\n";

  // Add default properties if provided
  if (defaultProperties && Object.keys(defaultProperties).length > 0) {
    Object.entries(defaultProperties).forEach(([property, value]) => {
      const definition = styleDefinitions[property as keyof T];
      if (!definition) return;

      let cssValue = definition.renderToCSS(value as never, isEditor);
      if (cssValue?.endsWith(";")) {
        cssValue = cssValue.slice(0, -1);
      }

      css += `${cssValue};\n`;
    });
  }

  // Group variants by breakpoint and state
  const variantsByBreakpoint: Record<string, Record<string, string[]>> = {};
  const variantsByState: Record<string, string[]> = {};

  // Process each style
  Object.entries(styles ?? {}).forEach(
    ([styleName, styleValue]: [keyof T | string, any]) => {
      const styleDef = styleDefinitions[styleName as keyof T];
      if (!styleDef || !styleValue?.length) return;

      // Process variants
      styleValue.forEach((variant: any) => {
        const variantCSS = styleDef.renderToCSS(variant.value, isEditor);
        if (!variantCSS) return;

        if (!variant.breakpoint?.length && !variant.state?.length) {
          css += variantCSS + "\n";
          return;
        }

        // If both breakpoints and states are provided, states are scoped to breakpoints
        if (variant.breakpoint?.length && variant.state?.length) {
          // Create a combined breakpoint key for AND condition
          const breakpointKey = variant.breakpoint.sort().join("|");
          if (!variantsByBreakpoint[breakpointKey]) {
            variantsByBreakpoint[breakpointKey] = {};
          }

          variant.state!.forEach((stateWithParent: StateWithTarget) => {
            const stateSelector = generateStateTargetSelector(stateWithParent);
            if (!variantsByBreakpoint[breakpointKey][stateSelector]) {
              variantsByBreakpoint[breakpointKey][stateSelector] = [];
            }

            variantsByBreakpoint[breakpointKey][stateSelector].push(variantCSS);
          });
        }
        // If only breakpoints are provided (no states)
        else if (variant.breakpoint?.length) {
          // Create a combined breakpoint key for AND condition
          const breakpointKey = variant.breakpoint.sort().join("|");
          if (!variantsByBreakpoint[breakpointKey]) {
            variantsByBreakpoint[breakpointKey] = {};
          }

          if (!variantsByBreakpoint[breakpointKey]["base"]) {
            variantsByBreakpoint[breakpointKey]["base"] = [];
          }

          variantsByBreakpoint[breakpointKey]["base"].push(variantCSS);
        }
        // If only states are provided (no breakpoints)
        else if (variant.state?.length) {
          variant.state.forEach((stateWithParent: StateWithTarget) => {
            const stateSelector = generateStateTargetSelector(stateWithParent);
            if (!variantsByState[stateSelector]) {
              variantsByState[stateSelector] = [];
            }

            variantsByState[stateSelector].push(variantCSS);
          });
        }
      });
    },
  );

  // Add state variants (no breakpoint)
  Object.entries(variantsByState).forEach(([stateSelector, cssRules]) => {
    if (cssRules.length > 0) {
      css += `&${stateSelector} {\n`;
      cssRules.forEach((rule) => {
        css += `  ${rule}\n`;
      });

      css += "}\n";
    }
  });

  // Add breakpoint variants
  Object.entries(variantsByBreakpoint).forEach(
    ([breakpointKey, stateGroups]) => {
      // Parse breakpoint key to get individual breakpoints
      const breakpoints = breakpointKey.split("|");

      // Create combined media query for all breakpoints (AND condition)
      const mediaQueries = breakpoints.map((bp) => getBreakpointMediaQuery(bp));
      const combinedMediaQuery = mediaQueries.join(" and ");

      css += `@media ${combinedMediaQuery} {\n`;

      Object.entries(stateGroups).forEach(([stateSelector, cssRules]) => {
        if (stateSelector === "base") {
          // Base styles within breakpoint
          cssRules.forEach((rule) => {
            css += `  ${rule}\n`;
          });
        } else {
          // State styles within breakpoint
          css += `  &${stateSelector} {\n`;
          cssRules.forEach((rule) => {
            css += `    ${rule}\n`;
          });

          css += "  }\n";
        }
      });

      css += "}\n";
    },
  );

  return css.trim();
}

// Main function: render styles for root and children
export function renderStylesToCSS<T extends BaseStyleDictionary>(
  styleDefinitions: StyleDictionary<T>,
  styles?: StyleValue<T> | null,
  defaultProperties?: DefaultCSSProperties<T> | null,
  isEditor?: boolean,
  className?: string,
): string {
  let css = "";
  const rootSelector = className ? `.${className}` : "&";

  // Separate styles by whether they have selectors or not
  const directStyles: StyleValue<T> = {};
  const childStyles: Record<string, StyleValue<T>> = {};

  if (styles) {
    Object.entries(styles).forEach(([styleName, styleValue]) => {
      const styleDef = styleDefinitions[styleName as keyof T];
      if (!styleDef) return;

      if (styleDef.selector) {
        // This style should be applied to children
        if (!childStyles[styleDef.selector]) {
          childStyles[styleDef.selector] = {};
        }

        childStyles[styleDef.selector][styleName as keyof T] = styleValue;
      } else {
        // This style should be applied directly
        directStyles[styleName as keyof T] = styleValue;
      }
    });
  }

  // Render direct styles for this level
  const directCSS = renderDirectStylesToCSS(
    styleDefinitions,
    directStyles,
    defaultProperties,
    isEditor,
  );

  if (directCSS.trim()) {
    css += `${rootSelector} {\n${directCSS}\n}\n`;
  }

  // Render child styles (styles with selectors)
  Object.entries(childStyles).forEach(([selector, childStyle]) => {
    const childCSS = renderDirectStylesToCSS(
      styleDefinitions,
      childStyle,
      undefined,
      isEditor,
    );

    if (childCSS.trim()) {
      const fullSelector = className ? `.${className} ${selector}` : selector;
      css += `\n${fullSelector} {\n${childCSS}\n}`;
    }
  });

  return css.trim();
}

function getBreakpointWidth(breakpoint: string): string {
  const breakpoints = {
    // Min-width breakpoints (>=)
    sm: "40rem", // >= 40rem (640px)
    md: "48rem", // >= 48rem (768px)
    lg: "64rem", // >= 64rem (1024px)
    xl: "80rem", // >= 80rem (1280px)
    "2xl": "96rem", // >= 96rem (1536px)

    // Max-width breakpoints (<)
    "max-sm": "40rem", // < 40rem (640px)
    "max-md": "48rem", // < 48rem (768px)
    "max-lg": "64rem", // < 64rem (1024px)
    "max-xl": "80rem", // < 80rem (1280px)
    "max-2xl": "96rem", // < 96rem (1536px)
  };

  return breakpoints[breakpoint as keyof typeof breakpoints] || "40rem";
}

function getBreakpointMediaQuery(breakpoint: string): string {
  const width = getBreakpointWidth(breakpoint);

  if (breakpoint.startsWith("max-")) {
    return `(max-width: ${width})`;
  } else {
    return `(min-width: ${width})`;
  }
}
