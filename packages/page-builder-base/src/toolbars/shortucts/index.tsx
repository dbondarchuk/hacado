import {
  Shortcut,
  ShortcutWithAssetSelector,
  ShortcutWithColor,
  ShortcutWithNumberWithUnit,
} from "../../shortcuts";
import { BaseStyleDictionary } from "../../style/types";
import {
  AssetSelectorShortcutToolbar,
  AssetSelectorShortcutToolbarItem,
  createAssetSelectorToolbarItem,
} from "./asset-selector-toolbar";
import {
  ColorShortcutToolbar,
  ColorShortcutToolbarItem,
  createColorToolbarItem,
} from "./color-shortcut-toolbar";
import {
  createDropdownToolbarItem,
  DropdownToolbar,
  ShortcutDropdownToolbarItem,
} from "./dropdown-toolbar";
import {
  createNumberWithUnitToolbarItem,
  NumberInputWithUnitsToolbarMenu,
  NumberWithUnitShortcutToolbarItem,
} from "./number-input-with-units-toolbar";
import {
  createToggleToolbarItem,
  ShortcutToggleToolbarItem,
  ToggleToolbar,
} from "./toggle-toolbar";

export type ShortcutToolbarItemUnion =
  | ShortcutDropdownToolbarItem
  | ShortcutToggleToolbarItem
  | NumberWithUnitShortcutToolbarItem
  | AssetSelectorShortcutToolbarItem
  | ColorShortcutToolbarItem;

/**
 * Creates toolbar items from shortcuts for use with custom toolbar components
 */
export const createShortcutsToolbarItems = <T extends BaseStyleDictionary>(
  shortcuts: Shortcut<T>[],
  data: any,
  setData: (data: any) => void,
): ShortcutToolbarItemUnion[] => {
  return shortcuts.map((shortcut) => {
    // Handle number-with-unit type separately
    if (shortcut.inputType === "number-with-unit") {
      return createNumberWithUnitToolbarItem(
        shortcut as ShortcutWithNumberWithUnit<T>,
        data,
        setData,
      );
    }
    // Handle asset-selector type separately
    if (shortcut.inputType === "asset-selector") {
      return createAssetSelectorToolbarItem(
        shortcut as ShortcutWithAssetSelector<T>,
        data,
        setData,
      );
    }
    // Handle color type separately
    if (shortcut.inputType === "color") {
      return createColorToolbarItem(
        shortcut as ShortcutWithColor<T>,
        data,
        setData,
      );
    }
    if (shortcut.inputType === "toggle") {
      return createToggleToolbarItem(shortcut, data, setData);
    }

    return createDropdownToolbarItem(shortcut, data, setData);
  });
};

interface ShortcutsToolbarProps<T extends BaseStyleDictionary> {
  shortcuts: Shortcut<T>[];
  data: any;
  setData: (data: any) => void;
}

const ShortcutToolbar = ({
  shortcut,
}: {
  shortcut: ShortcutToolbarItemUnion;
}) => {
  // Handle number-with-unit input type
  if (shortcut.shortcut.inputType === "number-with-unit") {
    const numberWithUnitShortcut =
      shortcut as NumberWithUnitShortcutToolbarItem;

    return (
      <NumberInputWithUnitsToolbarMenu
        shortcut={numberWithUnitShortcut}
        data={numberWithUnitShortcut.currentNumericValue}
        setData={numberWithUnitShortcut.onValueChange}
      />
    );
  }

  // Handle asset-selector input type
  if (shortcut.shortcut.inputType === "asset-selector") {
    const assetSelectorShortcut = shortcut as AssetSelectorShortcutToolbarItem;
    return <AssetSelectorShortcutToolbar shortcut={assetSelectorShortcut} />;
  }

  // Handle color input type
  if (shortcut.shortcut.inputType === "color") {
    const colorShortcut = shortcut as ColorShortcutToolbarItem;
    return <ColorShortcutToolbar shortcut={colorShortcut} />;
  }

  if (shortcut.shortcut.inputType === "toggle") {
    const toggleShortcut = shortcut as ShortcutToggleToolbarItem;
    return <ToggleToolbar shortcut={toggleShortcut} />;
  }

  // Handle regular shortcuts
  return <DropdownToolbar shortcut={shortcut as ShortcutDropdownToolbarItem} />;
};

export const ShortcutsToolbar = <T extends BaseStyleDictionary>({
  shortcuts,
  data,
  setData,
}: ShortcutsToolbarProps<T>) => {
  const toolbarItems = createShortcutsToolbarItems(shortcuts, data, setData);

  if (toolbarItems.length === 0) return null;

  return (
    <>
      {toolbarItems.map((item, index) => (
        <ShortcutToolbar
          key={`${item.shortcut.label}-${index}`}
          shortcut={item}
        />
      ))}
    </>
  );
};

export * from "./asset-selector-toolbar";
export * from "./color-shortcut-toolbar";
export * from "./dropdown-toolbar";
export * from "./number-input-with-units-toolbar";
export * from "./toggle-toolbar";
