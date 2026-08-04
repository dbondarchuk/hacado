import { useI18n } from "@timelish/i18n/client";
import { Label, RadioGroup, RadioGroupItem } from "@timelish/ui";
import { BaseStyleDictionary } from "../../style/types";
import { ShortcutOption, ShortcutWithRadio } from "../types";

export const RadioGroupShortcut = <T extends BaseStyleDictionary>({
  shortcut,
  currentValue,
  applyShortcut,
}: {
  shortcut: ShortcutWithRadio<T>;
  currentValue: string;
  applyShortcut: (option: ShortcutOption<T>) => void;
}) => {
  const t = useI18n();
  return (
    <RadioGroup
      value={currentValue || ""}
      onValueChange={(value) => {
        const selectedOption = shortcut.options.find(
          (opt) => opt.value === value,
        );
        if (selectedOption) {
          applyShortcut(selectedOption);
        }
      }}
      className="flex flex-wrap gap-2"
    >
      {shortcut.options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <RadioGroupItem
            value={option.value}
            id={`${shortcut.label}-${option.value}`}
          />
          <Label
            htmlFor={`${shortcut.label}-${option.value}`}
            className="text-xs"
            style={option.labelStyle}
          >
            {t.has(option.label) ? t(option.label) : option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};
