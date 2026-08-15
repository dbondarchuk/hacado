import { useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui";
import { BaseStyleDictionary } from "../../style/types";
import { ShortcutOption, ShortcutWithButtonGroup } from "../types";

export const ButtonGroupShortcut = <T extends BaseStyleDictionary>({
  shortcut,
  currentValue,
  applyShortcut,
}: {
  shortcut: ShortcutWithButtonGroup<T>;
  currentValue: string;
  applyShortcut: (option: ShortcutOption<T>) => void;
}) => {
  const t = useI18n();
  return (
    <div className="flex flex-wrap gap-1">
      {shortcut.options.map((option) => {
        const isSelected = currentValue === option.value;
        return (
          <Button
            key={option.value}
            variant={
              isSelected
                ? "default"
                : shortcut.buttonGroupConfig?.variant || "outline"
            }
            size={shortcut.buttonGroupConfig?.size || "sm"}
            onClick={() => applyShortcut(option)}
            className="text-xs"
            style={option.labelStyle}
          >
            {t.has(option.label) ? t(option.label) : option.label}
          </Button>
        );
      })}
    </div>
  );
};
