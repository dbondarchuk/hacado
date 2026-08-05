"use client";

import type { BaseBlockProps, SelectedSlotRef } from "@hacado/builder";
import { useSelectedSlotStyleHandlers } from "@hacado/builder";
import type { ReactNode } from "react";
import { StylesConfigurationPanel } from "../configuration-panel/styles-configuration-panel";
import type { Shortcut } from "../shortcuts/types";
import type { StyleValue } from "../style/css-renderer";
import type { BaseStyleDictionary, StyleDictionary } from "../style/types";

type SlotStylesPanelProps<T extends BaseStyleDictionary> = {
  slotKeys?: readonly string[];
  /** When set, any selectedSlot whose slotKey starts with this prefix is treated as a slot. */
  slotKeyPrefix?: string;
  selectedSlot?: SelectedSlotRef | null;
  availableStyles: StyleDictionary<T>;
  shortcuts?: Shortcut<T>[];
  blockStyles: StyleValue<T>;
  onBlockStylesChange: (styles: StyleValue<T>) => void;
  base?: BaseBlockProps;
  onBaseChange?: (base: BaseBlockProps) => void;
  children?: ReactNode;
};

export function SlotOrBlockStylesPanel<T extends BaseStyleDictionary>({
  slotKeys = [],
  slotKeyPrefix,
  selectedSlot,
  availableStyles,
  shortcuts,
  blockStyles,
  onBlockStylesChange,
  base,
  onBaseChange,
  children,
}: SlotStylesPanelProps<T>) {
  const { styles: slotStyles, setStyles: setSlotStyles } =
    useSelectedSlotStyleHandlers();

  const isSlot =
    !!selectedSlot &&
    (slotKeyPrefix
      ? selectedSlot.slotKey.startsWith(slotKeyPrefix)
      : slotKeys.includes(selectedSlot.slotKey));

  if (isSlot) {
    return (
      <StylesConfigurationPanel
        styles={slotStyles as StyleValue<T>}
        onStylesChange={setSlotStyles as (s: StyleValue<T>) => void}
        availableStyles={availableStyles}
        shortcuts={shortcuts}
      />
    );
  }

  return (
    <StylesConfigurationPanel
      styles={blockStyles}
      onStylesChange={onBlockStylesChange}
      availableStyles={availableStyles}
      shortcuts={shortcuts}
      base={base}
      onBaseChange={onBaseChange}
    >
      {children}
    </StylesConfigurationPanel>
  );
}
