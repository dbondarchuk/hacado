import { AllKeys, useI18n } from "@hacado/i18n/client";
import { ToolbarButton } from "@hacado/ui";
import { Shortcut } from "../../shortcuts";
import {
  applyShortcutOption,
  getShortcutCurrentValue,
} from "../../shortcuts/utils";
import { BaseStyleDictionary } from "../../style/types";

export interface ShortcutToggleToolbarItem {
  shortcut: Extract<Shortcut<BaseStyleDictionary>, { inputType: "toggle" }>;
  currentValue: string;
  onValueChange: (value: string) => void;
  tooltip: AllKeys;
}

export const createToggleToolbarItem = <T extends BaseStyleDictionary>(
  shortcut: Extract<Shortcut<T>, { inputType: "toggle" }>,
  data: any,
  setData: (data: any) => void,
): ShortcutToggleToolbarItem => {
  const getCurrentValue = (
    shortcut: Shortcut<T>,
    data: any,
  ): string | undefined => {
    return getShortcutCurrentValue(shortcut, data.style, data.props);
  };

  const applyShortcut = (
    shortcut: Extract<Shortcut<T>, { inputType: "toggle" }>,
    data: any,
    setData: (data: any) => void,
    optionValue: string,
  ) => {
    const selectedOption = shortcut.options.find(
      (opt: any) => opt.value === optionValue,
    );
    if (!selectedOption) return;

    applyShortcutOption(selectedOption, {
      styles: data.style,
      setData,
      data,
      props: data.props,
    });
  };

  return {
    shortcut,
    currentValue: getCurrentValue(shortcut, data) || "",
    onValueChange: (optionValue: string) =>
      applyShortcut(shortcut, data, setData, optionValue),
    tooltip: shortcut.label,
  };
};

export const ToggleToolbar = ({
  shortcut,
}: {
  shortcut: ShortcutToggleToolbarItem;
}) => {
  const t = useI18n();

  return (
    <ToolbarButton
      pressed={shortcut.currentValue === shortcut.shortcut.options[1].value}
      tooltip={t(shortcut.tooltip)}
      onClick={() =>
        shortcut.onValueChange(
          shortcut.currentValue === shortcut.shortcut.options[1].value
            ? shortcut.shortcut.options[0].value
            : shortcut.shortcut.options[1].value,
        )
      }
      className="text-xs"
    >
      <shortcut.shortcut.icon className="size-4" />
    </ToolbarButton>
  );
};
