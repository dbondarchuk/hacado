import { StylingConfiguration } from "@hacado/types";
import { genericMemo } from "@hacado/ui";
import { buildGoogleFontsUrl, deepEqual, getColorsCss } from "@hacado/utils";
import React from "react";
import {
  BaseStyleDictionary,
  DefaultCSSProperties,
  isParentTarget,
  isViewState,
  renderStylesToCSS,
  StateWithTarget,
  StyleDictionary,
  StyleValue,
} from "../style";
import { StateManager } from "./state-manager";

type Props = {
  styling?: StylingConfiguration;
};

const defaultStyling: StylingConfiguration = {
  fonts: {
    primary: "Montserrat",
    secondary: "Playfair Display",
    tertiary: "Roboto",
  },
  colors: [
    { type: "background", value: "0 0% 100%" },
    { type: "foreground", value: "222.2 84% 4.9%" },
    { type: "border", value: "214.3 31.8% 91.4%" },
    { type: "card", value: "0 0% 100%" },
    { type: "card-foreground", value: "222.2 84% 4.9%" },
    { type: "popover", value: "0 0% 100%" },
    { type: "popover-foreground", value: "222.2 84% 4.9%" },
    { type: "primary", value: "222.2 47.4% 11.2%" },
    { type: "primary-foreground", value: "210 40% 98%" },
    { type: "secondary", value: "210 40% 96.1%" },
    { type: "secondary-foreground", value: "222.2 47.4% 11.2%" },
    { type: "muted", value: "210 40% 96.1%" },
    { type: "muted-foreground", value: "215.4 16.3% 46.9%" },
    { type: "accent", value: "210 40% 96.1%" },
    { type: "accent-foreground", value: "222.2 47.4% 11.2%" },
    { type: "destructive", value: "0 84.2% 60.2%" },
    { type: "destructive-foreground", value: "210 40% 98%" },
  ],
};

export const Styling: React.FC<Props> = ({ styling: propsStyling }) => {
  const styling = {
    colors: [...(defaultStyling.colors || []), ...(propsStyling?.colors || [])],
    fonts: {
      ...defaultStyling.fonts,
      ...propsStyling?.fonts,
    },
  };

  const primaryFont = styling?.fonts?.primary!;
  const secondaryFont = styling?.fonts?.secondary!;
  const tertiaryFont = styling?.fonts?.tertiary!;

  const fontsCssUrl = buildGoogleFontsUrl(
    primaryFont,
    secondaryFont,
    tertiaryFont,
  );

  //   const fonts = await fontsRes.text();
  const colors = getColorsCss(styling?.colors, "value");
  return (
    <>
      <link rel="stylesheet" href={fontsCssUrl} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @layer base {
              
              :root {
                --font-primary-value: '${primaryFont}';
                --font-secondary-value: '${secondaryFont}';
                --font-tertiary-value: '${tertiaryFont}';
                ${colors}
              }
            }
          `,
        }}
      />
    </>
  );
};

export const BlockStyle = genericMemo(
  <T extends BaseStyleDictionary>({
    name,
    styles,
    defaults,
    styleDefinitions,
    isEditor,
  }: {
    name: string;
    styleDefinitions: StyleDictionary<T>;
    styles?: StyleValue<T> | null;
    defaults?: DefaultCSSProperties<T>;
    isEditor?: boolean;
  }) => {
    // renderStylesToCSS now handles the .className wrapper internally
    const css = renderStylesToCSS(
      styleDefinitions,
      styles,
      defaults,
      isEditor,
      name,
    );

    const states = extractParentStates(styles);

    return (
      <>
        <StateManager className={name} states={states} />
        <style
          dangerouslySetInnerHTML={{
            __html: css,
          }}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.name === nextProps.name &&
      deepEqual(prevProps.styles, nextProps.styles) &&
      deepEqual(prevProps.defaults, nextProps.defaults) &&
      deepEqual(prevProps.styleDefinitions, nextProps.styleDefinitions) &&
      prevProps.isEditor === nextProps.isEditor
    );
  },
);

function extractParentStates<T extends BaseStyleDictionary>(
  styles?: StyleValue<T> | null,
): StateWithTarget[] {
  const parentStates: StateWithTarget[] = [];

  if (!styles) return parentStates;

  Object.values(styles).forEach((styleValue) => {
    if (styleValue && Array.isArray(styleValue)) {
      styleValue.forEach((variant) => {
        if (variant.state && Array.isArray(variant.state)) {
          variant.state.forEach((state: StateWithTarget) => {
            if (isParentTarget(state) || isViewState(state.state)) {
              parentStates.push(state);
            }
          });
        }
      });
    }
  });

  return parentStates;
}
