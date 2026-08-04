import { AllKeys, useI18n } from "@timelish/i18n/client";
import { UploadedFile } from "@timelish/types";
import { ToolbarButton } from "@timelish/ui";
import { AssetSelectorDialog } from "@timelish/ui-admin";
import React from "react";
import { ShortcutWithAssetSelector } from "../../shortcuts";
import { BaseStyleDictionary } from "../../style/types";

export interface AssetSelectorShortcutToolbarItem {
  shortcut: ShortcutWithAssetSelector<BaseStyleDictionary>;
  currentAssetValue: string | null;
  onValueChange: (value: string) => void;
  tooltip: AllKeys;
}

export const AssetSelectorShortcutToolbar = ({
  shortcut,
}: {
  shortcut: AssetSelectorShortcutToolbarItem;
}) => {
  const t = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleAssetSelected = (asset: UploadedFile) => {
    const value = shortcut.shortcut.assetSelectorConfig?.fullUrl
      ? asset.url
      : `/assets/${asset.filename}`;
    shortcut.onValueChange(value);
    setIsOpen(false);
  };

  return (
    <>
      <ToolbarButton
        tooltip={t(shortcut.tooltip)}
        className="text-xs"
        onClick={() => setIsOpen(true)}
      >
        <shortcut.shortcut.icon className="size-4" />
      </ToolbarButton>
      <AssetSelectorDialog
        accept={
          shortcut.shortcut.assetSelectorConfig?.accept
            ? [shortcut.shortcut.assetSelectorConfig.accept]
            : undefined
        }
        isOpen={isOpen}
        close={() => setIsOpen(false)}
        onSelected={handleAssetSelected}
      />
    </>
  );
};

/**
 * Creates a specialized toolbar item for asset-selector shortcuts
 */
export const createAssetSelectorToolbarItem = <T extends BaseStyleDictionary>(
  shortcut: ShortcutWithAssetSelector<T>,
  data: any,
  setData: (data: any) => void,
): AssetSelectorShortcutToolbarItem => {
  // Get current asset value from the target style
  const currentStyle = data.style?.[shortcut.targetStyle]?.find(
    (s: any) => !s.breakpoint?.length && !s.state?.length,
  );

  const currentAssetValue: string | null =
    (shortcut.styleValue
      ? shortcut.styleValue.get(currentStyle?.value)
      : currentStyle?.value) || null;

  // Apply asset-selector value change
  const applyAssetSelectorValue = (value: string) => {
    const newData = { ...data };
    const newStyles = { ...newData.style };

    if (shortcut.styleValue?.set) {
      Object.keys(shortcut.styleValue.set).forEach((styleName: keyof T) => {
        const setStyleValue =
          shortcut.styleValue?.set[styleName] || ((value, prev) => value);

        if (newStyles[styleName]) {
          // Update existing style variants
          const currentVariants = newStyles[styleName];
          if (currentVariants && currentVariants.length > 0) {
            const updatedVariants = currentVariants.map((variant: any) => ({
              ...variant,
              value: setStyleValue(value, variant.value),
            }));
            newStyles[styleName] = updatedVariants;
          }
        }

        // Create new style variant
        newStyles[styleName] = [
          {
            breakpoint: [],
            state: [],
            value: setStyleValue(value, null),
          },
        ];
      });
    } else {
      if (newStyles[shortcut.targetStyle]) {
        // Update existing style variants
        const currentVariants = newStyles[shortcut.targetStyle];
        if (currentVariants && currentVariants.length > 0) {
          const updatedVariants = currentVariants.map((variant: any) => ({
            ...variant,
            value,
          }));
          newStyles[shortcut.targetStyle] = updatedVariants;
        }
      } else {
        // Create new style variant
        newStyles[shortcut.targetStyle] = [
          {
            breakpoint: [],
            state: [],
            value,
          },
        ];
      }
    }

    newData.style = newStyles;
    setData(newData);
  };

  return {
    shortcut: shortcut as ShortcutWithAssetSelector<BaseStyleDictionary>,
    currentAssetValue,
    onValueChange: applyAssetSelectorValue,
    tooltip: shortcut.label,
  };
};
