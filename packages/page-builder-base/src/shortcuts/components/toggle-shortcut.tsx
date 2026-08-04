import { useI18n } from "@timelish/i18n/client";
import { Toggle } from "@timelish/ui";
import { BaseStyleDictionary } from "../../style/types";
import { ShortcutOption, ShortcutWithToggle } from "../types";

export const ToggleShortcut = <T extends BaseStyleDictionary>({
  shortcut,
  currentValue,
  applyShortcut,
}: {
  shortcut: ShortcutWithToggle<T>;
  currentValue: string;
  applyShortcut: (option: ShortcutOption<T>) => void;
}) => {
  const t = useI18n();

  if (shortcut.options.length !== 2) {
    console.warn("Toggle input type requires exactly 2 options");
    return null;
  }

  const isOn = currentValue === shortcut.options[1].value;
  const label = isOn ? shortcut.options[1].label : shortcut.options[0].label;
  return (
    <Toggle
      pressed={isOn}
      onPressedChange={(pressed) => {
        const selectedOption = shortcut.options[pressed ? 1 : 0];
        applyShortcut(selectedOption);
      }}
      size="sm"
      className="w-full justify-between"
    >
      <span className="text-xs" style={shortcut.options[1].labelStyle}>
        {t.has(label) ? t(label) : label}
      </span>
    </Toggle>
  );
};
