import { AllKeys, useI18n } from "@hacado/i18n/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  ToolbarButton,
  useOpenState,
} from "@hacado/ui";
import { Shortcut, ShortcutOption } from "../../shortcuts";
import {
  applyShortcutOption,
  getShortcutCurrentValue,
} from "../../shortcuts/utils";
import { BaseStyleDictionary } from "../../style/types";

export interface ShortcutDropdownToolbarItem {
  shortcut: Extract<
    Shortcut<BaseStyleDictionary>,
    { options: ShortcutOption<BaseStyleDictionary>[] }
  >;

  currentValue: string;
  onValueChange: (value: string) => void;
  tooltip: AllKeys;
}

// Get current value for this shortcut
export const getCurrentValue = <T extends BaseStyleDictionary>(
  shortcut: Extract<Shortcut<T>, { options: ShortcutOption<T>[] }>,
  data: any,
): string | undefined => {
  return getShortcutCurrentValue(shortcut, data.style, data.props);
};

// Apply shortcut option
export const applyShortcut = <T extends BaseStyleDictionary>(
  shortcut: Extract<Shortcut<T>, { options: ShortcutOption<T>[] }>,
  data: any,
  setData: (data: any) => void,
  optionValue: string,
) => {
  const selectedOption = shortcut.options.find(
    (opt) => opt.value === optionValue,
  );
  if (!selectedOption) return;

  applyShortcutOption(selectedOption, {
    styles: data.style,
    setData,
    data,
    props: data.props,
  });
};

export const createDropdownToolbarItem = <T extends BaseStyleDictionary>(
  shortcut: Extract<Shortcut<T>, { options: ShortcutOption<T>[] }>,
  data: any,
  setData: (data: any) => void,
): ShortcutDropdownToolbarItem => {
  return {
    shortcut,
    currentValue: getCurrentValue(shortcut, data) || "",
    onValueChange: (optionValue: string) =>
      applyShortcut(shortcut, data, setData, optionValue),
    tooltip: shortcut.label,
  };
};

export const DropdownToolbar = ({
  shortcut,
}: {
  shortcut: ShortcutDropdownToolbarItem;
}) => {
  const t = useI18n();
  const openState = useOpenState();

  return (
    <DropdownMenu modal={false} {...openState}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          pressed={openState.open}
          tooltip={t(shortcut.tooltip)}
          isDropdown
          className="text-xs"
        >
          <shortcut.shortcut.icon className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-0" align="start">
        <DropdownMenuRadioGroup
          value={shortcut.currentValue}
          onValueChange={shortcut.onValueChange}
        >
          {shortcut.shortcut.options.map(({ value, label, labelStyle }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="min-w-[180px]"
              style={labelStyle}
            >
              {t.has(label) ? t(label) : label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
