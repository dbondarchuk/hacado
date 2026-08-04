"use client";
import { useI18n } from "@timelish/i18n/client";
import {
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Label,
} from "@timelish/ui";
import { ChevronRight, Settings } from "lucide-react";
import { useState } from "react";
import { StyleValue } from "../style/css-renderer";
import { BaseStyleDictionary } from "../style/types";
import { AssetSelectorShortcut } from "./components/asset-selector-shortcut";
import { ButtonGroupShortcut } from "./components/button-group-shortcut";
import { ColorShortcut } from "./components/color-shortcut";
import { ComboboxShortcut } from "./components/combobox-shortcut";
import { NumberWithUnitShortcut } from "./components/number-with-unit-shortcut";
import { RadioGroupShortcut } from "./components/radio-group-shortcut";
import { ToggleShortcut } from "./components/toggle-shortcut";
import {
  Shortcut,
  ShortcutOption,
  ShortcutWithAssetSelector,
  ShortcutWithButtonGroup,
  ShortcutWithColor,
  ShortcutWithCombobox,
  ShortcutWithNumberWithUnit,
  ShortcutWithRadio,
  ShortcutWithToggle,
} from "./types";
import { applyShortcutOption, getShortcutCurrentValue } from "./utils";

export * from "./common";
export * from "./components";
export * from "./types";

interface ShortcutsProps<T extends BaseStyleDictionary> {
  shortcuts: Shortcut<T>[];
  styles: StyleValue<T>;
  onStylesChange: (styles: StyleValue<T>) => void;
  props?: any;
  onPropsChange?: (props: any) => void;
}

export const Shortcuts = <T extends BaseStyleDictionary>({
  shortcuts,
  styles,
  onStylesChange,
  props,
  onPropsChange,
}: ShortcutsProps<T>) => {
  const t = useI18n();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const applyShortcut = (option: ShortcutOption<T>) => {
    applyShortcutOption(option, {
      styles,
      onStylesChange,
      props,
      onPropsChange,
    });
  };

  const getCurrentValue = (shortcut: Shortcut<T>): string | undefined => {
    return getShortcutCurrentValue(shortcut, styles, props);
  };

  const renderInputComponent = (shortcut: Shortcut<T>) => {
    const inputType = shortcut.inputType || "combobox";

    // Handle number-with-unit type separately since it doesn't have options
    if (inputType === "number-with-unit") {
      return (
        <NumberWithUnitShortcut
          shortcut={shortcut as ShortcutWithNumberWithUnit<T>}
          styles={styles}
          onStylesChange={onStylesChange}
        />
      );
    }

    // Handle asset-selector type separately since it doesn't have options
    if (inputType === "asset-selector") {
      return (
        <AssetSelectorShortcut
          shortcut={shortcut as ShortcutWithAssetSelector<T>}
          styles={styles}
          onStylesChange={onStylesChange}
        />
      );
    }

    // Handle color type separately since it doesn't have options
    if (inputType === "color") {
      return (
        <ColorShortcut
          shortcut={shortcut as ShortcutWithColor<T>}
          styles={styles}
          onStylesChange={onStylesChange}
        />
      );
    }

    const currentValue = getCurrentValue(shortcut);
    if (inputType === "radio") {
      return (
        <RadioGroupShortcut
          shortcut={shortcut as ShortcutWithRadio<T>}
          currentValue={currentValue || ""}
          applyShortcut={applyShortcut}
        />
      );
    }

    if (inputType === "toggle") {
      return (
        <ToggleShortcut
          shortcut={shortcut as ShortcutWithToggle<T>}
          currentValue={currentValue || ""}
          applyShortcut={applyShortcut}
        />
      );
    }

    if (inputType === "button-group") {
      return (
        <ButtonGroupShortcut
          shortcut={shortcut as ShortcutWithButtonGroup<T>}
          currentValue={currentValue || ""}
          applyShortcut={applyShortcut}
        />
      );
    }

    return (
      <ComboboxShortcut
        shortcut={shortcut as ShortcutWithCombobox<T>}
        currentValue={currentValue || ""}
        applyShortcut={applyShortcut}
      />
    );
  };

  if (shortcuts.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen}>
      <CollapsibleTrigger className="flex flex-row justify-between w-full items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          {t("builder.pageBuilder.styles.shortcuts")}
        </div>
        <ChevronRight
          className={cn(
            "size-4 transition-transform",
            isShortcutsOpen && "rotate-90",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        <div className="flex flex-col gap-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <shortcut.icon className="h-4 w-4 text-muted-foreground" />
                <Label className="text-muted-foreground text-xs font-medium">
                  {t(shortcut.label)}
                </Label>
              </div>
              {renderInputComponent(shortcut)}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
