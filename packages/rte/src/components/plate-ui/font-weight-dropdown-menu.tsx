"use client";

import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";

import { FontWeightPlugin } from "@udecode/plate-font/react";
import { useEditorRef, useEditorSelector } from "@udecode/plate/react";
import { Type } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  ToolbarButton,
  useOpenState,
} from "@hacado/ui";
import { useCallback } from "react";

const FONT_WEIGHT_VALUES = [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];

const ALL_FONT_WEIGHT_VALUES = ["", ...FONT_WEIGHT_VALUES];

export const useFontWeightDropdownMenu = () => {
  const editor = useEditorRef();

  const value = useEditorSelector(
    (editor) => editor.api.mark(FontWeightPlugin.key) as string,
    [FontWeightPlugin.key],
  );

  const updateFontWeight = useCallback(
    (value: string) => {
      if (editor.selection) {
        editor.tf.select(editor.selection);
        editor.tf.focus();

        if (value === "") {
          editor.tf.removeMarks(FontWeightPlugin.key);
        } else {
          editor.tf.addMarks({ [FontWeightPlugin.key]: value });
        }
      }
    },
    [editor, FontWeightPlugin.key],
  );

  return {
    values: ALL_FONT_WEIGHT_VALUES,
    radioGroupProps: {
      value,
      onValueChange: (newValue: string) => {
        updateFontWeight(newValue);
        editor.tf.focus();
      },
    },
  };
};

export function FontWeightDropdownMenu({ ...props }: DropdownMenuProps) {
  const openState = useOpenState();
  const { radioGroupProps, values } = useFontWeightDropdownMenu();

  return (
    <DropdownMenu modal={false} {...openState} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          pressed={openState.open}
          tooltip="Font weight"
          isDropdown
        >
          <Type />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-0" align="start">
        <DropdownMenuRadioGroup {...radioGroupProps}>
          {values.map((_value) => (
            <DropdownMenuRadioItem
              key={_value}
              className="min-w-[180px]"
              value={_value}
            >
              {_value === "" ? "Default" : _value}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
