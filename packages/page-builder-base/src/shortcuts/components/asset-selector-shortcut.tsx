import { BuilderKeys } from "@hacado/i18n";
import { AssetSelectorInput } from "@hacado/ui-admin";
import { StyleValue } from "../../style/css-renderer";
import { BaseStyleDictionary } from "../../style/types";
import { ShortcutWithAssetSelector } from "../types";

/**
 * Helper function to create asset-selector shortcuts
 */
export const createAssetSelectorShortcut = <
  T extends BaseStyleDictionary,
  TStyle extends keyof T = keyof T,
>(
  label: BuilderKeys,
  icon: (props: { className?: string }) => React.ReactNode,
  targetStyle: TStyle,
  styleValue?: ShortcutWithAssetSelector<T, TStyle>["styleValue"],
  config?: ShortcutWithAssetSelector<T, TStyle>["assetSelectorConfig"],
): ShortcutWithAssetSelector<T, TStyle> => {
  return {
    label,
    icon,
    inputType: "asset-selector",
    targetStyle,
    styleValue,
    assetSelectorConfig: config,
  };
};
export const AssetSelectorShortcut = <T extends BaseStyleDictionary>({
  shortcut,
  styles,
  onStylesChange,
}: {
  shortcut: ShortcutWithAssetSelector<T>;
  styles: StyleValue<T>;
  onStylesChange: (styles: StyleValue<T>) => void;
}) => {
  // Get current asset value from the target style
  const currentStyle = styles[shortcut.targetStyle]?.find(
    (s) => !s.breakpoint?.length && !s.state?.length,
  );

  let currentAssetValue: string | null = currentStyle?.value || null;
  if (shortcut.styleValue) {
    currentAssetValue = shortcut.styleValue.get(currentStyle?.value) || null;
  }

  const config = shortcut.assetSelectorConfig;

  const handleValueChange = (value: string) => {
    const newStyles = { ...styles };

    if (shortcut.styleValue?.set) {
      Object.keys(shortcut.styleValue.set).forEach((styleName: keyof T) => {
        const setStyleValue =
          shortcut.styleValue?.set[styleName] || ((value, prev) => value);

        if (newStyles[styleName]) {
          // Update existing style variants
          const currentVariants = newStyles[styleName];
          if (currentVariants && currentVariants.length > 0) {
            const updatedVariants = currentVariants.map((variant) => ({
              ...variant,
              value: setStyleValue(value, variant.value),
            }));
            newStyles[styleName] = updatedVariants as StyleValue<T>[keyof T];
          }
        } else {
          // Create new style variant
          newStyles[styleName] = [
            {
              breakpoint: [],
              state: [],
              value: setStyleValue(value, null),
            },
          ] as unknown as StyleValue<T>[keyof T];
        }
      });
    } else {
      if (newStyles[shortcut.targetStyle]) {
        // Update existing style variants
        const currentVariants = newStyles[shortcut.targetStyle];
        if (currentVariants && currentVariants.length > 0) {
          const updatedVariants = currentVariants.map((variant) => ({
            ...variant,
            value,
          }));
          newStyles[shortcut.targetStyle] =
            updatedVariants as StyleValue<T>[keyof T];
        }
      } else {
        // Create new style variant
        newStyles[shortcut.targetStyle] = [
          {
            breakpoint: [],
            state: [],
            value,
          },
        ] as unknown as StyleValue<T>[keyof T];
      }
    }

    onStylesChange(newStyles);
  };

  return (
    <AssetSelectorInput
      value={currentAssetValue}
      onChange={handleValueChange}
      accept={config?.accept}
      fullUrl={config?.fullUrl}
      placeholder={config?.placeholder}
      h="sm"
    />
  );
};
